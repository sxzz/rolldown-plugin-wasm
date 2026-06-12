import { nodeLib } from 'tsdown-preset-sxzz'

export default nodeLib(
  {},
  {
    exports: {
      customExports: {
        './types': './types.d.ts',
      },
    },
  },
)
