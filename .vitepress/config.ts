import { defineConfig } from 'vitepress';
import { getSidebar } from 'vitepress-plugin-auto-sidebar';

// import fs from "fs";
// import path from "path";
// import process from 'node:process';

// interface Options {
//   contentRoot?: string;
//   contentDirs?: string[] | null;
//   collapsible?: boolean;
//   collapsed?: boolean;
// }

// function getSidebarItems(dir: string[], currentRoot: string | undefined, root: string | undefined, options: Options): object {
// 	return dir.filter(e => e.endsWith('.md') || fs.statSync(path.resolve(currentRoot ?? '/', e)).isDirectory()).map((e: string) => {
//     const childDir = path.resolve(currentRoot ?? '/', e);
//     if (fs.statSync(childDir).isDirectory()) {
//       return {
//         text: (e.charAt(0).toUpperCase() + e.slice(1)).replaceAll('-', ' '),
//         collapsible: options.collapsible,
//         collapsed: options.collapsed,
//         items: getSidebarItems(fs.readdirSync(childDir), childDir, root, options)
//       };
//     } else if (e.endsWith('.md')) {
//       return {
//         text: ((e.charAt(0).toUpperCase() + e.slice(1)).slice(0, -3)).replaceAll('-', ' '),
//         link: childDir.replace(root ?? '', '')
//       };
//     }
//     return {};
//   })
// };

// function getSidebar(options: Options = {}) {
//   options.contentRoot = options?.contentRoot ?? '/';
//   options.contentDirs = options?.contentDirs ?? null;
//   options.collapsible = options?.collapsible ?? true;
//   options.collapsed = options?.collapsed ?? true;

// 	options.contentRoot = path.join(process.cwd(), options.contentRoot)
// 	const dir = fs.readdirSync(options.contentRoot).filter((file: string) => (options.contentDirs === null || options.contentDirs?.indexOf(file) !== -1) && fs.statSync(path.join(options.contentRoot ?? '/', file)).isDirectory());
// 	return getSidebarItems(dir, options.contentRoot, options.contentRoot, options)
// }

export default defineConfig({
  title: '3D Graphics Beginner Tutorials and Projects',
  description: '',
  base: '/3d-graphics-beginner-projects/',
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shrekshao/3d-graphics-beginner-projects' }
    ],
    sidebar: getSidebar({
      contentRoot: '/',
      contentDirs: ['lessons', 'projects'],
      collapsible: false,
      collapsed: false,
    }) as any,
    footer: {
      message: 'Released under the <a href="https://github.com/shrekshao">3-Clause BSD License</a>',
      copyright: '© 2023-present <a href="https://github.com/shrekshao">shrekshao</a>'
    }
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    zh: {
      label: '简体中文',
      lang: 'zh'
    }
  },
});
