import { getSidebar } from 'vitepress-plugin-auto-sidebar'

export default {
  // site-level options
  title: '3D Graphics Beginner Projects',
  description: '',

  themeConfig: {
    // theme-level options
    displayAllHeaders: false,
    sidebar: getSidebar({ contentRoot: '/', contentDirs: ['lessons', 'projects'], collapsible: false, collapsed: false })
  }
}
