import { nodeLib } from 'tsdown-preset-sxzz'

export default nodeLib(
  {},
  {
    exports: {
      customExports(exports) {
        exports['./types'] = './types.d.ts'
        return exports
      },
    },
  },
)
