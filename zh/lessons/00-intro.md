<script setup lang='ts'>
import ImgCaption from '../../src/components/img-caption.vue';
</script>

# 3D图形学初学者入门介绍
##### -- 关于完全能听懂的电脑是怎么把3D游戏画出来的我知道的那些事

::: tip 为什么有这篇文章
TODO
:::


## 引子问题

简单且笼统地说，图形学就是研究如何用计算机完成这么一个任务：把“场景描述信息”转变成“画面”。

把这个任务再拆分成一些更小的子任务，可以帮助我们发现具体需要解决哪些问题：

## 如何向计算机精确地描述场景？
  - 场景里有什么“东西”，每个“东西”长什么样子，摆在哪里，表面是什么颜色？
  - 如果用拍电影类比，场景是从哪里，什么角度，用什么镜头拍摄的？

## 如何把场景信息，“投影”到像素的二维数组上？

第一个问题：描述这些东西

你一定听说过“3D模型”这个词
TODO：用三角形

<ImgCaption src='/img/blender-wireframe.jpg'>
3D建模软件<a href='https://www.blender.org/'>Blender</a>的截图。 从右侧Wireframe视图可以看出，人物模型是由三角形和四边形（两个三角形）构成的。类似的3D建模软件为用户提供了图形化交互界面以方便地创建和调整三角形的顶点位置，并最终导出成保存一系列三角形数据地模型文件，用来被3D渲染程序使用。
</ImgCaption>

于是我们把“画场景”这个问题，转变为了如何“画N个三角形”。也即如何做N次“画一个三角形”这项任务。

::: details 为什么是三角形？不是四边形，圆形，或者椭球？

经过历史上的探索，人们发现三角形的应用场景会很普遍，且具有一些良好的性质:
- 足够简单: 任何三角形都可以通过它的三个顶点坐标来表示。就是三组 (x, y, z)向量, 也即9个浮点数。
- 三角形中的任意一点，都可由它的三个顶点的线性插值来表示。(因为三角形是[凸多边形](https://en.wikipedia.org/wiki/Convex_polygon)，四边形不一定是)
- 多个三角形的组合成或近似组合成其他基本图形（比如四边形可以由两个三角形构成）

所以如果我们的大部分场景中的物体都由三角形构成，那么渲染程序只要解决了“画三角形”这一件事，就可以画出大部分的任意场景。
:::

## 给定任意已知三个顶点坐标地三角形，如何把它“画”出来？

在之前的画2D圆形的例子中，你所实现的程序实际上是完成一个叫“光栅化”(Rasterization)的步骤：

- 它的输入：矢量图形信息（一推三角形的顶点坐标）
- 它的输出：以二维数组形式排列的像素点颜色值(RGB)

::: details 为什么是输出二维数组的像素？
这是由常见图片文件的存储格式（位图）和常用显示设备的成像原理（显示器）所决定。对每一个像素点他们存储红(R)，绿(G)，蓝(B)颜色值，或发射出红(R)，绿(G)，蓝(B)光线。

<ImgCaption src='/img/rgb-lcd.jpg'>
靠近观查显示橙色（上）和蓝色（下）的LCD显示器可以发现每个像素由红绿蓝发光单元组成。
</ImgCaption>

当然，每个像素点存储的数据也可以根据需要而变。比如早期的单色液晶演示器每个像素可能只需要存储一个bit。有些有趣的渲染器也能用ASIIC字符显示每个像素。


<ImgCaption src='https://github.com/alecjacobson/ascii3d/raw/master/suzanne-ascii3d.gif'>
来自github: https://github.com/alecjacobson/ascii3d
</ImgCaption>
:::

在之前的例子中，把一个给定圆心坐标额半径的2D圆形“光栅化”看起来很直接和简单。2D矩形如果和坐标轴对齐（Axis Aligned），也很简单。没对齐的矩形看起来就没那么直接了。对于“光栅化一个在3D空间中的任意三角形”这项任务，我们需要用到一些数学工具。

### 数学：矩阵和变换

如果你学过一点线性代数，你会对这部分概念感到很熟悉。如果你没有学过也没关系，因为我们只会使用一点点最基础的矩阵数学作为工具，只需要了解工具的用途而不必理解工具本身是如何运作的。

我们会把3D空间中的点用齐次坐标(Homogenous coordinate)表示成向量形式

$$
p = {\left(
\begin{array}{lcr}
      x \\
      y \\
      z \\
      1
\end{array}
\right)}
$$

::: details xyz后面的1是干什么的？
这里xyz后面的1仅是用来方便进行平移和投影矩阵运算的。你可以试试用下面平移矩阵T乘上这个向量会得到什么。如果你希望了解更多细节可以阅读[仿射变换和齐次坐标](https://zh.wikipedia.org/zh-hans/%E4%BB%BF%E5%B0%84%E5%8F%98%E6%8D%A2)
:::

3D空间中的常见变换可以用特定的矩阵表示，比如缩放，旋转（以绕x轴为例），平移分别可以表示为：

$$
\boldsymbol{S} = {\left(
\begin{array}{lcr}
      s_x & 0 & 0 & 0 \\
      0 & s_y & 0 & 0 \\
      0 & 0 & s_z & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
$$

$$
\boldsymbol{R} = {\left(
\begin{array}{}
      1 & 0 & 0 & 0 \\
      0 & \cos\theta & -\sin\theta & 0 \\
      0 & \sin\theta & \cos\theta & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
$$

$$
\boldsymbol{T} = {\left(
\begin{array}{lcr}
      1 & 0 & 0 & t_x \\
      0 & 1 & 0 & t_y \\
      0 & 0 & 1 & t_z \\
      0 & 0 & 0 & 1
\end{array}
\right)}
$$

用相应的变换矩阵乘以一个点的向量坐标，可以得到这个点变换后的坐标。而一系列变换也可以通过矩阵相乘来叠加。
比如我们如果我们要将一个三角形放大成两倍，绕x轴旋转90度，再沿y轴正向平移3个单位，只需要对这个三角形的三个顶点都依次乘上三个变换矩阵，就能得到这个三角形三个顶点的新坐标了。

$$
\begin{align*}
p' &= \boldsymbol{T}\boldsymbol{R}\boldsymbol{S}p \\
&= {\left(
\begin{array}{lcr}
      1 & 0 & 0 & t_x \\
      0 & 1 & 0 & t_y \\
      0 & 0 & 1 & t_z \\
      0 & 0 & 0 & 1
\end{array}
\right)}
{\left(
\begin{array}{}
      1 & 0 & 0 & 0 \\
      0 & \cos\theta & -\sin\theta & 0 \\
      0 & \sin\theta & \cos\theta & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
{\left(
\begin{array}{lcr}
      s_x & 0 & 0 & 0 \\
      0 & s_y & 0 & 0 \\
      0 & 0 & s_z & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
{\left(
\begin{array}{lcr}
      x \\
      y \\
      z \\
      1
\end{array}
\right)} \\
&= {\left(
\begin{array}{lcr}
      1 & 0 & 0 & 0 \\
      0 & 1 & 0 & 3 \\
      0 & 0 & 1 & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
{\left(
\begin{array}{lcr}
      1 & 0 & 0 & 0 \\
      0 & 0 & -1 & 0 \\
      0 & 1 & 0 & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
{\left(
\begin{array}{lcr}
      2 & 0 & 0 & 0 \\
      0 & 2 & 0 & 0 \\
      0 & 0 & 2 & 0 \\
      0 & 0 & 0 & 1
\end{array}
\right)}
{\left(
\begin{array}{lcr}
      x \\
      y \\
      z \\
      1
\end{array}
\right)} \\
&= {\left(
\begin{array}
      2x \\
      -2z + 3 \\
      2y \\
      1
\end{array}
\right)}
\end{align*}
$$

### 坐标系的转换

有了上面介绍的数学工具，我们就可以通过变换坐标系来安排和管理场景中来自不同模型的三角形了。很常见的情况是，场景中有多个3D模型。每个3D模型中的三角形的顶点坐标都是在他们各自的坐标系中的。我们首先需要把他们转换到同一个坐标系中，通常称为世界坐标系（World Coordinate）。把各自模型坐标系（Model Coordinate）中的顶点坐标，转换到世界坐标系的变换矩阵，通常叫做模型矩阵（Model Matrix）。它通常可以用一组缩放，旋转，和平移矩阵来表示出来。每个场景中的物体都具有一个模型矩阵，由此我们可以精确地描述每个物体在世界中地摆放情况。

$$
\boldsymbol{M_i} = \boldsymbol{T_i}\boldsymbol{R_i}\boldsymbol{S_i}
$$

之前介绍了相机的概念。相机/取景框/观察者，和其他物体，3D模型一样，处在世界中。把世界坐标系（World Coordinate）中的顶点坐标，转换到视角所在坐标系（View Coordinate）地变换矩阵，通常叫做视角矩阵（View Matrix）。

$$
\boldsymbol{V} = \boldsymbol{T_v}\boldsymbol{R_v}
$$

### 投影变换：3D→2D的神奇一步

TODO：配view frustum example配图

到此为止，我们的三角形的顶点坐标经过一些变换，依然处在3D空间内。如何把他们投影到2D的像素平面上，并且符合透视规则，看起来就像一幅画一样呢？

其实还是通过矩阵来进行坐标变换。这个矩阵叫做投影矩阵。它的性质和之前的缩放，旋转，平移矩阵稍有不同（不是仿射矩阵）

$$
p_{ij}' = \boldsymbol{P}\boldsymbol{V}\boldsymbol{M_i}p_{ij}
$$

$$
\boldsymbol{T} = {\left(
\begin{array}{lcr}
      1 & 0 & 0 & t_x \\
      0 & 1 & 0 & t_y \\
      0 & 0 & 1 & t_z \\
      0 & 0 & 0 & 1
\end{array}
\right)}
$$

在当今流行的图形API中，这一步通常被称为Vertex Stage。他决定了三角形们的顶点在2D显示框中的坐标。

### 光栅化

::: tip 拓展阅读
这里只是简略介绍了坐标变换矩阵和投影矩阵，想要了解更细节在图形API中的使用可以浏览 [WebGPU Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-translation.html)
:::

::: details “光栅化”并不是唯一的算法
“光栅化”（Rasterization）仍是当今在实时渲染领域（比如游戏）使用的算法。它很快，有很好的硬件支持，但其实是一种hack——他并没有很好地处理每束光的传播，反射等。同时它也并不是我们解决“把3D世界画出来”这一问题的唯一方案。

“光线追踪”（Ray Tracing
）传统上被广泛应用在离线渲染领域（比如动画电影）。他更善于解决各种来自环境的多次间接反射的光照处理。也因此它通常效果更好但更慢。不过正如你一定听过RTX On，光追等词汇，在硬件性能发展的今天，Ray Tracing也开始被部分运用在实时渲染领域。

在这两者之外，如果感兴趣，你还可以看看<a href='https://www.shadertoy.com/'>Shadertoy</a>。这里的程序大多并非用模型文件，而是用数学函数来描述的，配合使用Ray marching方法进行渲染。这在渲染一些无限循环的分形图形，纹理，以及体积云雾等时非常有用。
:::

我们刚才这一些操作告诉我们要在哪儿画像素。

在当今流行的图形API中，这一步通常被称为Rasterization Stage。因为广泛的需求和通用性，这一步通常已经由硬件和其驱动（driver）封装完成。




## 如何决定每个像素的颜色？

之前的坐标变换和光栅化，让我们可以对任意的三角形，相机位置，投影参数等输入，都可以给出所有三角形顶点在2D屏幕上的坐标，以及每个需要点亮的像素点坐标。如果我们要画的物体是物理学意义上的绝对黑体，我们已经收工了——只要把每个要画的像素都涂黑就行了。

要模拟真实世界的3D渲染，你会发现我们还需要解决另一个问题：如何决定每个要画的像素的颜色。经历过之前的步骤，你会自然想到我们需要定义每个场景中物体的材质，场景中的光源大小，强弱，方向，颜色等，并用适当的数学工具表示出他们。





不过我猜你想了解的是那种以假乱真的模拟真实世界的渲染风格（Photorealistic）。基于物理的渲染（Physically based rendering）

### 纹理贴图（Texture）

还记得三角形的性质吗？其中任意一点都可以表示为它三个顶点的线性插值。

贴图并不局限于颜色。常见的其他贴图有法线，材质光滑度，发光度等。

### 光照算法：BxDF

光线沿直线传播（当它在同一介质中时）。现实世界中我们看到不同的物体，是因为光传播中碰到物体后会反射，折射出不同颜色的光。对每种材质的表面，假设我们拥有这样一个函数，他以入射光的颜色和方向为输入，输出其在每个方向的反射光的颜色，那么对于任意物体表面的任意点，我们都可以根据场景描述信息获得他应呈现的颜色。

光源位置，物体位置，法向向量

BSDF = BRDF + BTDF

双向反射分布函数（BRDF: Bidirectinal Reflectance Distribution Function）
Bling Phong

### 基于物理的渲染（PBR: Physically Based Rendering）

GGX 为例

::: details 风格化渲染
到此我们讨论的完全是模拟真实世界的基于物理规则的渲染风格（Photorealistic）
实际上我们并非一定要遵循基于真实物理规则渲染。决定每个像素的颜色这一步其实完全取决于你想呈现的画面风格。
3D虚拟世界中物体呈现的颜色不必来自光源和反射，可以像卡通一样直接指定，也可以给每个物体加上描黑轮廓等等。
我们要做的是写出一段程序，对于任意的顶点和像素位置，能得到统一的风格。


:::


### 后处理

和拍照P图类似。只要有足够的信息，和算法，就能算出来。



到这里，你已经了解了3D渲染的最基本原理。

<ImgCaption src='https://www.adriancourreges.com/img/blog/2015/gtav/a/00_final_frame.jpg'>
A rendered image from the Game Grand Theft Auto 5 from an <a href='https://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study/'>article</a> by Adrian Courrèges. You might find it very interesting after you learn some 3D graphics
</ImgCaption>

## 讲了这么多，还没提到GPU是干什么的？


<ImgCaption src='/img/cpu-gpu-architecture.png'>
简化的CPU和GPU架构图 
<a href='https://docs.nvidia.com/cuda/cuda-c-programming-guide/'>Nvidia CUDA programming guide</a>
</ImgCaption>


~~## 很好，如果我要做3D游戏，我得自己写代码实现上面的每一步吗？~~



## 除了电子游戏，GPU或图形学还有哪些有趣的应用领域？



## 我已经迫不及待要去做3D游戏了，我要用什么引擎？

永远正确的废话：根据自身需求，选择合适的工具。


## 图形学有哪些应用？~~其实我想问能找什么工作~~

