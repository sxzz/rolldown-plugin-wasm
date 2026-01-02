import { nodeLib } from 'tsdown-preset-sxzz'

export default nodeLib(
  {
    inlineDeps: ['@antfu/utils'],
  },
  {
    exports: {
      customExports(exports) {
        exports['./types'] = './types.d.ts'
        return exports
      },
    },
  },
)
