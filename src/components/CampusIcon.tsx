import type { LucideIcon } from 'lucide-react'
import {
  BatteryCharging,
  BedDouble,
  Binary,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building,
  CircuitBoard,
  ClipboardCheck,
  ClipboardList,
  CodeXml,
  Cog,
  DoorOpen,
  Droplets,
  Dumbbell,
  Flame,
  Goal,
  GraduationCap,
  HardHat,
  Landmark,
  Mountain,
  Network,
  PlugZap,
  Ruler,
  Theater,
  Trophy,
  UtensilsCrossed,
  Volleyball,
  WavesLadder,
  Wrench,
  Zap,
} from 'lucide-react'
import type { CampusIcon, CategoryId } from '../data/campusGraph'

const campusIconMap: Record<CampusIcon, LucideIcon> = {
  book: BookOpen,
  'clipboard-check': ClipboardCheck,
  utensils: UtensilsCrossed,
  theater: Theater,
  waves: WavesLadder,
  goal: Goal,
  volleyball: Volleyball,
  dumbbell: Dumbbell,
  bed: BedDouble,
  code: CodeXml,
  zap: Zap,
  'hard-hat': HardHat,
  cog: Cog,
  binary: Binary,
  network: Network,
  brain: BrainCircuit,
  plug: PlugZap,
  battery: BatteryCharging,
  circuit: CircuitBoard,
  ruler: Ruler,
  building: Building,
  mountain: Mountain,
  wrench: Wrench,
  flame: Flame,
  droplets: Droplets,
  door: DoorOpen,
  briefcase: BriefcaseBusiness,
  'clipboard-list': ClipboardList,
}

export const categoryIconMap: Record<CategoryId, LucideIcon> = {
  facility: Landmark,
  sports: Trophy,
  hostel: BedDouble,
  department: GraduationCap,
  lab: ClipboardList,
  gate: DoorOpen,
  placement: BriefcaseBusiness,
  administration: Building,
}

interface CampusIconProps {
  icon: CampusIcon
  size?: number
  strokeWidth?: number
  className?: string
}

export function CampusLocationIcon({
  icon,
  size = 18,
  strokeWidth = 1.8,
  className,
}: CampusIconProps) {
  const Icon = campusIconMap[icon]
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}

interface CategoryIconProps {
  category: CategoryId
  size?: number
  strokeWidth?: number
  className?: string
}

export function CategoryIcon({
  category,
  size = 16,
  strokeWidth = 1.8,
  className,
}: CategoryIconProps) {
  const Icon = categoryIconMap[category]
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}
