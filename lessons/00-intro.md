<script setup lang='ts'>
import ImgCaption from '../src/components/img-caption.vue';
</script>

# Intro

If you are asked to write a program that draws on a 2D blank canvas based on a given description of the scene, what will you end up with?

Let's better define the problem with more details: 
- Program input: a description of the scene. Let's start with a simple example: *"A red rectangle, with width and height being 50, at the top-left corner"*
- Program output: A 100x100 2D canvas, represented by an array of pixels. Each pixel value has a `Color`, represented by 3 numbers: <span style="color:#f00">Red</span>, <span style="color:#0f0">Green</span>, <span style="color:#00f">Blue</span>. and Alpha (how transparent it is).

Using Typescript and HTML to implement this, we might have some simplest working code like this:

``` typescript
const c = document.createElement("canvas");
c.width = 100;
c.height = 100;
document.body.appendChild(c);
const ctx = c.getContext("2d");
const imgData = ctx.createImageData(c.width, c.height);
for (let x = 0; x < c.width; x++) {
  for (let y = 0; y < c.height; y++) {
    if (x <= 50 && y <= 50) {
      const i = 4 * (x * c.height + y);
      imgData.data[i + 0] = 255;
      imgData.data[i + 1] = 0;
      imgData.data[i + 2] = 0;
      imgData.data[i + 3] = 255;
    }
  }
}
ctx.putImageData(imgData, 0, 0);
```

::: tip Prerequsite
You should feel mostly comfortable reading this piece of program. If you are just not familiar with Typescript, you might find this helpful: [Tutorials for programmers from other languages](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
:::

You probably already notice that the program hardcoded the scene description. You are absolutely right. We just manually interprete the natural language scene description and it's not extendable at all. What if our scene can be made of different rectangles and circles? Then we might think of the following datastructure to describe the scene instead of natural langugae.

``` typescript
class DrawObject {
  type: 'rect' | 'circle',
  color: number[],
};

class Rect extends DrawObject {
  top: number,
  left: number,
  bottom: number,
  right: number
};

class Circle extends DrawObject {
  x: number,
  y: number,
  radius: number
};

const shapes: DrawObject[];

// ...
```

``` typescript
// TEMP not working
class DrawObject {
  type: 'rect' | 'circle',
  color: number[],
  hitObject(x: number, y: number): bool { return false; };
};

class Rect extends DrawObject {
  top: number,
  bottom: number,
  left: number,
  right: number,
  
  constructor(top: number, bottom: number, left: number, right: number) {
    super();
    this.type = 'rect';
    this.color = [0, 0, 255, 255];
    
  	this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
  }

  hitObject(x: number, y: number): bool {
  	return y >= top && y <= bottom && x >= left && x <= right;
  }
};

class Circle extends DrawObject {
  x: number,
  y: number,
  radius: number
  
  hitObject(x: number, y: number): bool {
  	return y >= top && y <= bottom && x >= left && x <= right;
  }
};


const c = document.createElement("canvas");
/* const c = document.querySelector('#cc'); */
c.width = 500;
c.height = 500;
document.body.appendChild(c);
const ctx = c.getContext("2d");
const imgData = ctx.createImageData(c.width, c.height);
for (let x = 0; x < c.width; x++) {
  for (let y = 0; y < c.height; y++) {
    if (x <= 50 && y <= 50) {
      const i = 4 * (x * c.height + y);
      imgData.data[i + 0] = 255;
      imgData.data[i + 1] = 0;
      imgData.data[i + 2] = 0;
      imgData.data[i + 3] = 255;
    }
  }
}

const objects = [
  new Rect(20, 50, 80, 120),
];

for (let x = 0; x < c.width; x++) {
  for (let y = 0; y < c.height; y++) {
    const i = 4 * (x * c.height + y);
    for (let obj of objects) {
/*        if (obj.hitObject(x, y)) {
        imgData.data[i + 0] = obj.color[0];
        imgData.data[i + 1] = obj.color[1];
        imgData.data[i + 2] = obj.color[2];
        imgData.data[i + 3] = obj.color[3];
             } */
    }
  }
}

ctx.putImageData(imgData, 0, 0);
```

Now our program can draw scenes like *"2 blue 10x10 rects whose top-left are at (1, 10) and (40, 30), 1 yellow circle at (70, 10) with radius=10"*.

What if we want to draw a vehicle? How do we precisely describe a vehicle? Maybe a rect plus two circles as the wheels. Then what if we want to draw a human? What if we want to draw a house, a human, and a vehicle with some relative position? How do we describe that?

We are only talking about 2D cases that so far handled by our elementary school math. But what about all the 3D games? How is the 3D scene described? When in 3D space, how do I tell the program what view it should draw with? Maybe introduce some concept called camera?

And what about the colors? a vehicle can have different colors on it's tire, body, etc. Also, the vehicle body can reflect the environment. It's one color under the sun, and another color under a roof. What about the windshield? It's transparent but what is the color of it?

Hey, that's too many questions at once. But hold on, you just find out the general problem computer graphics is basically trying to solve.

* Computer Graphics (CG) find ways to build the program whose:
  - Input is a scene/world/set of objects to draw, which needs precisely describing
  - Output is a *"Rendered"* image result

::: details In comparison, what is CV?
Computer vision (CV as you might have heard), is to find ways to build program that takes image as input, and outputs information about the image, e.g. a description of what content is in that image (identification), what pixels belong to what objects (segmentation) etc.

Today more graphics research are hybriding the vision and AI stuff. TODO: stay tunned
:::


<ImgCaption src='https://www.adriancourreges.com/img/blog/2015/gtav/a/00_final_frame.jpg'>
A rendered image from the Game Grand Theft Auto 5 from an <a href='https://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study/'>article</a> by Adrian Courrèges. You might find it very interesting after you learn some 3D graphics
</ImgCaption>


Now let's revisit the series of questions we asked earilier and learn what the domains computer graphics is aim to solve.

## How to describe an object?

Back to our series of questions earilier: what if I want to draw a vehicle, how do I represent a vehicle in program, etc. Computer graphics first need to solve the problem of how to precisely describe scene. You might've heard about 3D model files a lot. Yes, that's the most widely used way in industry today to solve the problem of *"how to describe a vehicle"*.

All objects triangles...

If you open a `.obj` 3D model file as a text document, what you will see is just a long list of numbers. Usually 3 numbers in a line starting with `v` are representing the x,y,z coordinate of a vertex (point). And each 3 vertices are representing a triangles.


```
v -0.806124 0.440184 0.440084
v -0.737070 -0.000000 0.797186
v -0.612160 -0.000000 0.797185
```

<ImgCaption src='/img/blender-wireframe.jpg'>
A screenshot from <a href='https://www.blender.org/'>Blender</a>. You can see the wireframe of the character model indicates it's built by triangles and quads (2 triangles). Modeling tools like this allows artists to design interactively and then export as model files to be consumed by programs.
</ImgCaption>


::: tip Why triangles?

There are some good properties:
- Simple enough: any arbitrary triangle can be represented by three 3D vertices. That's three (x, y, z)s, 9 numbers.
- Any points can be represented by linear interpolation of the three vertices.
  - It is guarenteed to be convex (vs concave, TODO: link)
- Able to approximate most other shapes
- ...

Actually, there are other primitives: points (1 point), lines (2 point). These together with triangles (3 point) are used together in most 3D models files.

Also, using 3D points coordinates is not the only way to represent the objects. There are scenarios other methods do the job better. For example, splines, molding mud (morphing objects), realistic fog (volumetric objects). 

TODO: links
:::

At this step we've turned *"the description of objects"* into just *data*. Computer programs love data. We will learn how to upload, label, and process these data in [Project 00 draw something](../projects/00-draw-sth)

## How to describe and manage the scene, the view, in 3D?

Okay, we've got vehicles, characters, houses, etc. But look at the GTA image, how do we put them together? I do tell that "I want to take this shot at that angle"?

Short answer is: math. Some basic linear algebra. We will learn the details in [Lesson 01 Matrix Maths](../lessons/01-matrix-math)

But to give you an intuitive understanding of how it work, let's try go back to our earlier attempt of drawing shapes on a canvas. What if you are trying to build a 2D scrolling platformer game? Yes we have the canvas, the coordinate of the character and the background image. You might have already done the coordinate transform without noticing it.

<ImgCaption src='https://cdn.teachertube.com/uploads/2019/03/12/485265/2d-platformer-part-1000.jpg'>
What will you do when the character is moving towards the right edge of the screen/viewport? To track the character, intuitively we are very likely writing code to move the background image leftwards. Although the background(world) doesn't actually move, by doing so, the relative position of the character and the background. We are implicitly applying a transform of the background(world) to the coordinate system of the screen/viewport/camera.
</ImgCaption>

There's one more step of "magical" coordinate transform: projection, which slaps all vertices scattered in the 3D space to a 2D plane, which is our canvas/screen/viewport.

<ImgCaption src='https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Axonometric_projection.svg/150px-Axonometric_projection.svg.png'>
Source: <a href='https://en.wikipedia.org/wiki/3D_projection'>Wikipedia</a>
</ImgCaption>



## How to draw the triangles with their vertices coordinate?

What you do in your 2D draw program is actually called "rasterization". It is the process of taking vector graphics input (the vertices coordinate of the shapes) into a series of pixels.

In your earlier programming effort of draw a rect, you might find "rasterizing" an axis-aligned rectangle is pretty straight-forward. To rasterize an arbitrary triangle there needs to be a bit more work. Usually we need to get the equation representation of the three edges and then we are able to tell if a pixel lies inside or outside of the triangle given its coordinate. You will learn more at [Lesson 02 Ray trace and rasterize](../lessons/02-ray-trace-and-rasterize).

Because the process of rasterizing shapes into pixels is so commonly used, it is integrated in the GPU hardware.

There are many other details involved in the rasterizing step to get a nice clean image. For example antialiasing is not a trivial task at all. And people have developed many different approaches for various scenarios and different performance cost. You will learn more about antialiasing at [Lesson 05 Prettier](../lessons/05-prettier).

<ImgCaption src='https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Line_pixel_subpixel_aa.gif/220px-Line_pixel_subpixel_aa.gif'>
A gif gives you an idea of what is anti-aliasing from <a href='https://en.wikipedia.org/wiki/Rasterisation'>wikipedia</a>
</ImgCaption>

Rasterization isn't the only way to turn your triangle vertices numbers into pixels. Another widely used technicque is called Ray tracing. Also there are cases where triangle isn't the best choice to represent the object, for example, fog, dust, or morph shapes, people have developed many differrent techniques to "calculate" their shapes.

<ImgCaption src='/img/shadertoy.jpg'>
<a href='https://www.shadertoy.com/'>Shadertoy</a> is a website consists of many shader experiment. Usually ray marching is used to render the scene. The object are usually represented by some surface equation instead of vertices data.
</ImgCaption>

## How do we decide the colors of these triangles?

Once we have the pixels, we need to decide what color we should give to each pixel. A blue rectangle isn't uniformmally blue under certain lighting settings, it can be lit as bright blue, shaded as grey, or, reflecting the enviornment background. This step is called "shading". And that's actually a very big research topic in computer graphics. A lot of computation is needed here, usually starts with calculating the surface distance to the light, the normal vector of the surface, and the properties of the surface material. More will be introduced in [Lesson 05 Prettier](../lessons/05-prettier).

Physically based rendering, which models after how the real world light photon lits the object, is widely used by mainstream engines starting ~2012. Since then, realistic rendering is not done by tricks anymore but can be achieved by expecting a set of well-formed assets providing material features capturing real-world physical features, like metalness, roughness.

<ImgCaption src='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/screenshot/screenshot.png'>
A glTF model testing physically based material properties.
</ImgCaption>

TODO: extend more: introduce common technique, shaders to draw objects. (reference: https://lettier.github.io/3d-game-shaders-for-beginners/index.html)

## Looks fine, but what is GPU doing here?

At this point, you may wonder: hey, I pretty much understand all the above process, and I can't wait to write some program to try implementing those. But that seems all doable with my existing knowledge writing a program. Where is GPU? Where are the things called shaders, Direct3D, OpenGL... Why are they so frequently mentioned when talking about 3D graphics? what roles do they play?

The short answer: performance!

In a real time rendering 3D games, to reach a smooth interactive experimence, it usually needs to render 30 frames per second (fps), or even 60 fps. This means the program needs to render a frame under ~33ms (~16.7ms for 60fps). For a modern game, that means handling computation of tens of thousands of triangles, and several milions of pixels. Although the work for each triangle or pixel is mostly the same, the slight difference in their data (say angle of the incoming light) makes it hard to reuse the computation for one pixel from another. I personally think the word "embarrasingly parrallel" precisely describes the situation here. Writing a piece of code in traditional CPU to **sequentially** process all these triangles/pixels computation workload is not going to meet the time requirement here.

However, people observed that the 3D graphics problems have some common traits:
  - The computation process for each triangle/pixel is mostly the same, and fixed, for any 3D games/apps. And actually pretty simple -- it's just floating point number computations -- compared to the different,  flexible, and complicated CPU program logic.
  - Computation of each triangle/pixel is **parrallel** to each other, there's little dependency. i.e. one pixel doesn't need to wait for result of another pixel to finish its computation.

So people started design specialized hardware that are good at handling these tasks ~1990s. And named it the graphics process unit (GPU). Nowadays, GPU consists of smaller cores and memory caches compared to CPU. But there are many of them, which means they can handle many parrallel tasks at once.

<ImgCaption src='/img/cpu-gpu-architecture.png'>
Simplified CPU and GPU architecture from
<a href='https://docs.nvidia.com/cuda/cuda-c-programming-guide/'>Nvidia CUDA programming guide</a>
</ImgCaption>


<ImgCaption src='/img/graphics-pipeline.svg'>
Simplified GPU graphics pipeline from
<a href='https://vulkan-tutorial.com/Drawing_a_triangle/Graphics_pipeline_basics/Introduction'>Vulkan Tutorial</a>
</ImgCaption>




## What else is exciting besides 3D?

You must have heard GPUs are used for things like machine learning, or coin (cryptocurrency) mining. Wait, are these things related to graphcis processing at all?

TODO: GPGPU

Instead of drawing to a traditional 2D rectangle canvas, when you draw your 3D scenes to 2 distorted 2D image, you are actually doing VR!

TODO: VR, lightfield, hologram


::: details Any colors?
RGB to represent any colors? Well, not really. TODO: Color space, monitor gamma
:::

## Applications

Applications of computer graphics today: ~~No, what I want to ask is what job can I get with graphics and GPU knowledge.~~

  - Games
  - Animations
  - Design/Simulation
  - GUI

TODO: introduce apps using graphics API. (GUI - windows blurry effect: blending equation in API)

TODO: introduce 