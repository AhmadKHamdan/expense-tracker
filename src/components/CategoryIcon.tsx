import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type IconMap = Record<string, React.ComponentType<LucideProps>>

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (Icons as unknown as IconMap)[name] ?? Icons.Circle
  return <Icon {...props} />
}
