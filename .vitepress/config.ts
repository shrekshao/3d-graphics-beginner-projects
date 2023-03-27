import { getSidebar } from 'vitepress-plugin-auto-sidebar'

export default {
  // site-level options
  title: '3D Graphics Beginner Projects',
  description: 'Just playing around.',

  themeConfig: {
    // theme-level options
    sidebar: getSidebar({ contentRoot: '/', contentDirs: ['src'], collapsible: true, collapsed: true })
  }
}
