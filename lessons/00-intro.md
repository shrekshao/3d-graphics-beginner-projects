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

<!-- ![](https://www.adriancourreges.com/img/blog/2015/gtav/a/00_final_frame.jpg) -->

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

<ImgCaption src='/assets/img/blender-wireframe.jpg'>
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

Okay, we've got vehicles, characters, houses, etc. But look at the GTA image, how do we put them together? I do tell that "I want to take this shot at that angle"? How to I manage the 3D scene


TODO: use 2D platformer to Intuitively introduce the coordinate systems. world space, view space.


TODO: projections

We will learn the details in [Lesson 01 Matrix Maths](../lessons/01-matrix-math)



## How to draw the triangles?


## How do we decide the colors of these triangles?


## Looks fine, but what is GPU doing here?

At this point, you may wonder: hey, I pretty much understand all the above process, and I can't wait to write some program to try implementing those. But that seems all doable with my existing knowledge writing a program. Where is GPU? Where are the things called shaders, Direct3D, OpenGL... Why are they so frequently mentioned when talking about 3D graphics? what roles do they play?

The short answer: performance!

In a real time rendering 3D games, to reach a smooth interactive experimence, it usually needs to render 30 frames per second (fps), or even 60 fps. This means the program needs to render a frame under ~33ms (~16.7ms for 60fps). For a modern game, that means handling computation of tens of thousands of triangles, and several milions of pixels. Although the work for each triangle or pixel is mostly the same, the slight difference in their data (say angle of the incoming light) makes it hard to reuse the computation for one pixel from another. I personally think the word "embarrasingly parrallel" precisely describes the situation here. Writing a piece of code in traditional CPU to **sequentially** process all these triangles/pixels computation workload is not going to meet the time requirement here.

However, people observed that the 3D graphics problems have some common traits:
  - The computation process for each triangle/pixel is mostly the same, and fixed, for any 3D games/apps. And actually pretty simple -- it's just floating point number computations -- compared to the different,  flexible, and complicated CPU program logic.
  - Computation of each triangle/pixel is **parrallel** to each other, there's little dependency. i.e. one pixel doesn't need to wait for result of another pixel to finish its computation.

So people started design specialized hardware that are good at handling these tasks ~1990s. And named it the graphics process unit (GPU). Nowadays, GPU consists...

<ImgCaption src='/assets/img/cpu-gpu-architecture.png'>
Simplified CPU and GPU architecture from
<a href='https://docs.nvidia.com/cuda/cuda-c-programming-guide/'>here</a>
</ImgCaption>


<ImgCaption src='/assets/img/graphics-pipeline.svg'>
Simplified GPU graphics pipeline from
<a href='https://vulkan-tutorial.com/Drawing_a_triangle/Graphics_pipeline_basics/Introduction'>here</a>
</ImgCaption>




## What else is exciting besides 3D?

You must have heard GPUs are used for things like machine learning, or coin (cryptocurrency) mining. Wait, are these things related to graphcis processing at all?

TODO: GPGPU




::: tip
Color
TODO: linear interploation of RGB

:::

::: details Any colors?
RGB to represent any colors? Well, not really. TODO: Color space, monitor gamma
:::

## Applications

Applications of computer graphics today: ~~No, what I want to ask is what job can I get with graphics and GPU knowledge.~~

  - Games
  - Animations
  - Design/Simulation
  - GUI
