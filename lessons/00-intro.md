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

Hey, that's too many questions. But yeah, you just find out the general problem computer graphics is basically trying to solve.

* Computer Graphics find ways to build the program whose:
  - Input is a scene/world/set of objects to draw, which needs precisely describing
  - Output is a *"Rendered"* image result

<!-- ![](https://www.adriancourreges.com/img/blog/2015/gtav/a/00_final_frame.jpg) -->

<figure>
  <img src='https://www.adriancourreges.com/img/blog/2015/gtav/a/00_final_frame.jpg'>
  <figcaption style="text-align: center">A rendered scene from the Game Grand Theft Auto 5 from an <a href='https://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study/'>article</a> by Adrian Courrèges. You might find it very interesting after you learn some 3D graphics</figcaption>
</figure>

::: tip
Color
TODO: linear interploation of RGB

:::

::: details More about Color space
RGB to represent any colors? Well, not really. TODO: Color space, monitor gamma
:::

## What is Compute Graphics, and what is not?

* Computer Graphics
  - Input: information describing the scene we want to draw.
  - Output: *"Rendered"* result
    - A 2D image (General)
    - Two warped 2D images (VR)
    - Intermediate result??
      - 3D models (Procedual generations)
      - Positions of objects (simulation)

Comparison:

* Computer vision
  - Input: image
  - Output: information



Triangles

Some good properties:
- Simple enough: 3 points, 9 float numbers in 3D space
- Any points can be represented by linear interpolation of the three vertices.
- Able to approximate most other shapes
- ...

## Applications today
  - Games
  - Animations
  - Design/Simulation
  - GUI


## Story of GPU, and how does it work