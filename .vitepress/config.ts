import { getSidebar } from 'vitepress-plugin-auto-sidebar'

// TODO: use customized getSidebar func
// This one doesn't work with i18n

export default {
  // site-level options
  title: '3D Graphics Beginner Projects',
  description: '',

  themeConfig: {
    // theme-level options
    displayAllHeaders: false,
    sidebar: getSidebar({ contentRoot: '/', contentDirs: ['lessons', 'projects'], collapsible: false, collapsed: false })
  },

  // vite: {
  //   plugins: [
  //     AutoSidebar,
  //   ]
  // },

  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    zh: {
      label: '简体中文',
      lang: 'zh'
    }
  }
}
