import { Toggle as TogglePrimitive } from 'radix-ui'

function Toggle(props) {
  return <TogglePrimitive.Root data-slot="toggle" {...props} />
}

export { Toggle }
