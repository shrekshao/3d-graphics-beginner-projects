# Intro


If you are asked to write a program that draws on a 2D blank canvas based on a given description of the scene, what will you end up with?

That's basically what computer graphics is all about.

You are probably already familiar with the concept that we can use an array to represent the canvas. Each element in the array represents the `Color` for that pixel. And any `Color` can be represented by 4 numbers: Red, Green, Blue, and Alpha. Interpolations of Red, Green, Blue channels can give you any colors and Alpha channel decide how transparent it is.

What if I asked you to draw a red rectangle at top-left corner?

```typescript
const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");
const imgData = ctx.createImageData(c.width, 100);

for (let i = 0; i < imgData.data.length; i += 4) {
  // TODO: decide coord
  imgData.data[i + 0] = 255;
  imgData.data[i + 1] = 0;
  imgData.data[i + 2] = 0;
  imgData.data[i + 3] = 255;
}
```

What if the scene contains multiple objects? A blue circle; A person stand in front of a vehicle, by 3 meters, facing north-east; A clock with it's minitue leg rotating at the speed of 1 degree per minute;

What if the world I want to draw is 3D? How do I describe the world and the view I want?

::: tip
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