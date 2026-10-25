/**
 * CampusPath sample campus graph
 * --------------------------------
 * All walking distances in this file are realistic SAMPLE values for an
 * academic graph demonstration. They are not surveyed campus measurements.
 *
 * The graph is undirected unless an edge is explicitly marked `directed`.
 */

export type CategoryId =
  | 'facility'
  | 'sports'
  | 'hostel'
  | 'department'
  | 'lab'
  | 'gate'
  | 'placement'
  | 'administration'

export type CampusIcon =
  | 'book'
  | 'clipboard-check'
  | 'utensils'
  | 'theater'
  | 'waves'
  | 'goal'
  | 'volleyball'
  | 'dumbbell'
  | 'bed'
  | 'code'
  | 'zap'
  | 'hard-hat'
  | 'cog'
  | 'binary'
  | 'network'
  | 'brain'
  | 'plug'
  | 'battery'
  | 'circuit'
  | 'ruler'
  | 'building'
  | 'mountain'
  | 'wrench'
  | 'flame'
  | 'droplets'
  | 'door'
  | 'briefcase'
  | 'clipboard-list'

export interface CategoryMeta {
  id: CategoryId
  label: string
  shortLabel: string
  color: string
  tint: string
  description: string
}

export interface CampusNode {
  id: string
  number: number
  name: string
  shortName: string
  category: CategoryId
  icon: CampusIcon
  x: number
  y: number
  description: string
}

export interface CampusEdge {
  from: string
  to: string
  distance: number
  /** All campus walking paths are bidirectional by default. */
  directed?: boolean
}

export interface AdjacentLocation {
  node: CampusNode
  distance: number
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'facility',
    label: 'Campus Facilities',
    shortLabel: 'Facilities',
    color: '#68734A',
    tint: '#E9ECDF',
    description: 'Shared spaces at the centre of campus life.',
  },
  {
    id: 'sports',
    label: 'Sports Facilities',
    shortLabel: 'Sports',
    color: '#A4743F',
    tint: '#F3E8D7',
    description: 'Grounds and courts for outdoor recreation.',
  },
  {
    id: 'hostel',
    label: 'Hostels',
    shortLabel: 'Hostels',
    color: '#8A6857',
    tint: '#F0E4DD',
    description: 'Residential blocks on the north side.',
  },
  {
    id: 'department',
    label: 'Academic Departments',
    shortLabel: 'Departments',
    color: '#526A73',
    tint: '#E3EAEB',
    description: 'Teaching and faculty offices for each discipline.',
  },
  {
    id: 'lab',
    label: 'Department Laboratories',
    shortLabel: 'Labs',
    color: '#5D7061',
    tint: '#E5EBE2',
    description: 'Specialised practical spaces attached to departments.',
  },
  {
    id: 'gate',
    label: 'Campus Gates',
    shortLabel: 'Gates',
    color: '#A45F49',
    tint: '#F3E3DC',
    description: 'Primary pedestrian access points to the campus.',
  },
  {
    id: 'placement',
    label: 'Placement & Careers',
    shortLabel: 'Placement',
    color: '#8A733E',
    tint: '#F1E9D3',
    description: 'Internship, placement, and career support.',
  },
  {
    id: 'administration',
    label: 'Administration',
    shortLabel: 'Admin',
    color: '#776054',
    tint: '#EDE4DE',
    description: 'Coordination and departmental administration.',
  },
]

export const campusNodes: CampusNode[] = [
  {
    id: 'library',
    number: 1,
    name: 'Library',
    shortName: 'LIB',
    category: 'facility',
    icon: 'book',
    x: 570,
    y: 315,
    description: 'Central library and quiet study hub at the heart of campus.',
  },
  {
    id: 'admission-cell',
    number: 2,
    name: 'Admission Cell',
    shortName: 'ADM',
    category: 'facility',
    icon: 'clipboard-check',
    x: 370,
    y: 420,
    description: 'Admissions, fee assistance, and new-student onboarding.',
  },
  {
    id: 'mess',
    number: 3,
    name: 'Mess',
    shortName: 'MESS',
    category: 'facility',
    icon: 'utensils',
    x: 430,
    y: 250,
    description: 'Central dining hall serving the residential blocks.',
  },
  {
    id: 'auditorium',
    number: 4,
    name: 'Auditorium',
    shortName: 'AUD',
    category: 'facility',
    icon: 'theater',
    x: 760,
    y: 360,
    description: 'Main venue for college events, talks, and gatherings.',
  },
  {
    id: 'swimming-pool',
    number: 5,
    name: 'Swimming Pool',
    shortName: 'POOL',
    category: 'sports',
    icon: 'waves',
    x: 900,
    y: 245,
    description: 'Olympic-length pool and aquatic training facility.',
  },
  {
    id: 'ground-1',
    number: 6,
    name: 'Ground 1',
    shortName: 'G1',
    category: 'sports',
    icon: 'goal',
    x: 850,
    y: 120,
    description: 'Main multi-purpose sports ground and athletics field.',
  },
  {
    id: 'ground-2',
    number: 7,
    name: 'Ground 2',
    shortName: 'G2',
    category: 'sports',
    icon: 'goal',
    x: 1020,
    y: 140,
    description: 'Secondary ground used for practice and tournaments.',
  },
  {
    id: 'volleyball-ground',
    number: 8,
    name: 'Volleyball Ground',
    shortName: 'VBG',
    category: 'sports',
    icon: 'volleyball',
    x: 1100,
    y: 250,
    description: 'Outdoor volleyball courts beside the sports complex.',
  },
  {
    id: 'kabaddi-ground',
    number: 9,
    name: 'Kabaddi Ground',
    shortName: 'KBG',
    category: 'sports',
    icon: 'dumbbell',
    x: 1115,
    y: 355,
    description: 'Dedicated kabaddi field for practice and inter-college matches.',
  },
  {
    id: 'hostel-1',
    number: 10,
    name: 'Hostel 1',
    shortName: 'H1',
    category: 'hostel',
    icon: 'bed',
    x: 250,
    y: 100,
    description: 'Residential block with shared study and recreation rooms.',
  },
  {
    id: 'hostel-2',
    number: 11,
    name: 'Hostel 2',
    shortName: 'H2',
    category: 'hostel',
    icon: 'bed',
    x: 380,
    y: 85,
    description: 'Residential block on the north-west residential avenue.',
  },
  {
    id: 'hostel-3',
    number: 12,
    name: 'Hostel 3',
    shortName: 'H3',
    category: 'hostel',
    icon: 'bed',
    x: 510,
    y: 105,
    description: 'Residential block closest to the central dining hall.',
  },
  {
    id: 'hostel-4',
    number: 13,
    name: 'Hostel 4',
    shortName: 'H4',
    category: 'hostel',
    icon: 'bed',
    x: 150,
    y: 205,
    description: 'Residential block beside the west campus entrance.',
  },
  {
    id: 'hostel-5',
    number: 14,
    name: 'Hostel 5',
    shortName: 'H5',
    category: 'hostel',
    icon: 'bed',
    x: 285,
    y: 200,
    description: 'Residential block in the middle of the hostel avenue.',
  },
  {
    id: 'hostel-6',
    number: 15,
    name: 'Hostel 6',
    shortName: 'H6',
    category: 'hostel',
    icon: 'bed',
    x: 140,
    y: 335,
    description: 'Residential block near the west gate and garden path.',
  },
  {
    id: 'hostel-7',
    number: 16,
    name: 'Hostel 7',
    shortName: 'H7',
    category: 'hostel',
    icon: 'bed',
    x: 285,
    y: 335,
    description: 'Residential block adjoining the hostel common area.',
  },
  {
    id: 'cse-department',
    number: 17,
    name: 'CSE Department',
    shortName: 'CSE',
    category: 'department',
    icon: 'code',
    x: 505,
    y: 520,
    description: 'Computer Science and Engineering teaching block.',
  },
  {
    id: 'ee-department',
    number: 18,
    name: 'Electrical Engineering (EE) Department',
    shortName: 'EE',
    category: 'department',
    icon: 'zap',
    x: 685,
    y: 610,
    description: 'Electrical Engineering department and faculty offices.',
  },
  {
    id: 'civil-department',
    number: 19,
    name: 'Civil Engineering Department',
    shortName: 'CIV',
    category: 'department',
    icon: 'hard-hat',
    x: 870,
    y: 520,
    description: 'Civil Engineering teaching block and design studios.',
  },
  {
    id: 'mechanical-department',
    number: 20,
    name: 'Mechanical Engineering Department',
    shortName: 'MEC',
    category: 'department',
    icon: 'cog',
    x: 1055,
    y: 540,
    description: 'Mechanical Engineering department and machine design wing.',
  },
  {
    id: 'programming-lab',
    number: 21,
    name: 'Programming Lab',
    shortName: 'PRG',
    category: 'lab',
    icon: 'code',
    x: 390,
    y: 640,
    description: 'CSE computing lab for programming and algorithm practice.',
  },
  {
    id: 'data-structures-lab',
    number: 22,
    name: 'Data Structures Lab',
    shortName: 'DSA',
    category: 'lab',
    icon: 'binary',
    x: 520,
    y: 615,
    description: 'CSE lab focused on data structures and problem solving.',
  },
  {
    id: 'computer-networks-lab',
    number: 23,
    name: 'Computer Networks Lab',
    shortName: 'NET',
    category: 'lab',
    icon: 'network',
    x: 610,
    y: 520,
    description: 'CSE lab for networking, protocols, and distributed systems.',
  },
  {
    id: 'ai-ml-lab',
    number: 24,
    name: 'AI and Machine Learning Lab',
    shortName: 'AIML',
    category: 'lab',
    icon: 'brain',
    x: 560,
    y: 705,
    description: 'CSE lab for artificial intelligence and machine learning work.',
  },
  {
    id: 'electrical-machines-lab',
    number: 25,
    name: 'Electrical Machines Lab',
    shortName: 'EML',
    category: 'lab',
    icon: 'plug',
    x: 755,
    y: 700,
    description: 'EE lab for motors, generators, and electrical machines.',
  },
  {
    id: 'power-systems-lab',
    number: 26,
    name: 'Power Systems Lab',
    shortName: 'PWR',
    category: 'lab',
    icon: 'battery',
    x: 625,
    y: 745,
    description: 'EE lab for power analysis and protection systems.',
  },
  {
    id: 'electronics-lab',
    number: 27,
    name: 'Electronics Lab',
    shortName: 'ELC',
    category: 'lab',
    icon: 'circuit',
    x: 790,
    y: 600,
    description: 'EE lab for analogue and digital electronics experiments.',
  },
  {
    id: 'surveying-lab',
    number: 28,
    name: 'Surveying Lab',
    shortName: 'SUR',
    category: 'lab',
    icon: 'ruler',
    x: 890,
    y: 400,
    description: 'Civil lab for surveying, levelling, and field measurement.',
  },
  {
    id: 'structural-engineering-lab',
    number: 29,
    name: 'Structural Engineering Lab',
    shortName: 'STR',
    category: 'lab',
    icon: 'building',
    x: 985,
    y: 520,
    description: 'Civil lab for structural testing and materials research.',
  },
  {
    id: 'geotechnical-engineering-lab',
    number: 30,
    name: 'Geotechnical Engineering Lab',
    shortName: 'GEO',
    category: 'lab',
    icon: 'mountain',
    x: 880,
    y: 640,
    description: 'Civil lab for soil mechanics and geotechnical studies.',
  },
  {
    id: 'workshop-lab',
    number: 31,
    name: 'Workshop Lab',
    shortName: 'WRK',
    category: 'lab',
    icon: 'wrench',
    x: 1140,
    y: 465,
    description: 'Mechanical fabrication and workshop practice facility.',
  },
  {
    id: 'thermodynamics-lab',
    number: 32,
    name: 'Thermodynamics Lab',
    shortName: 'THR',
    category: 'lab',
    icon: 'flame',
    x: 1125,
    y: 630,
    description: 'Mechanical lab for heat engines and thermal systems.',
  },
  {
    id: 'fluid-mechanics-lab',
    number: 33,
    name: 'Fluid Mechanics Lab',
    shortName: 'FLD',
    category: 'lab',
    icon: 'droplets',
    x: 1015,
    y: 700,
    description: 'Mechanical lab for fluid flow and hydraulic machinery.',
  },
  {
    id: 'main-gate-1',
    number: 34,
    name: 'Main Gate 1',
    shortName: 'MG1',
    category: 'gate',
    icon: 'door',
    x: 105,
    y: 770,
    description: 'Primary south-west entrance connecting campus to the city.',
  },
  {
    id: 'main-gate-2',
    number: 35,
    name: 'Main Gate 2',
    shortName: 'MG2',
    category: 'gate',
    icon: 'door',
    x: 70,
    y: 215,
    description: 'West entrance beside the residential blocks.',
  },
  {
    id: 'main-gate-3',
    number: 36,
    name: 'Main Gate 3',
    shortName: 'MG3',
    category: 'gate',
    icon: 'door',
    x: 1200,
    y: 745,
    description: 'East entrance serving the engineering academic quarter.',
  },
  {
    id: 'tpo-cell',
    number: 37,
    name: 'TPO Cell',
    shortName: 'TPO',
    category: 'placement',
    icon: 'briefcase',
    x: 330,
    y: 550,
    description:
      'Training and Placement Office for campus placements, internships, and career guidance.',
  },
  {
    id: 'department-cell',
    number: 38,
    name: 'Department Cell',
    shortName: 'DEPT',
    category: 'administration',
    icon: 'clipboard-list',
    x: 675,
    y: 435,
    description:
      'Administrative office for department coordination and academic-related activities.',
  },
]

/**
 * Walking connections in metres. Undirected by default; set `directed: true`
 * on an edge if a one-way path is introduced later.
 */
export const campusEdges: CampusEdge[] = [
  // Residential quarter
  { from: 'main-gate-2', to: 'hostel-4', distance: 80 },
  { from: 'main-gate-2', to: 'hostel-6', distance: 60 },
  { from: 'hostel-4', to: 'hostel-1', distance: 110 },
  { from: 'hostel-4', to: 'hostel-5', distance: 70 },
  { from: 'hostel-4', to: 'hostel-6', distance: 95 },
  { from: 'hostel-1', to: 'hostel-2', distance: 55 },
  { from: 'hostel-1', to: 'hostel-5', distance: 65 },
  { from: 'hostel-2', to: 'hostel-3', distance: 55 },
  { from: 'hostel-2', to: 'hostel-5', distance: 75 },
  { from: 'hostel-3', to: 'mess', distance: 90 },
  { from: 'hostel-5', to: 'mess', distance: 95 },
  { from: 'hostel-6', to: 'hostel-7', distance: 70 },
  { from: 'hostel-7', to: 'hostel-5', distance: 95 },
  { from: 'hostel-7', to: 'mess', distance: 120 },
  { from: 'hostel-1', to: 'mess', distance: 135 },

  // Central campus
  { from: 'mess', to: 'admission-cell', distance: 110 },
  { from: 'mess', to: 'library', distance: 115 },
  { from: 'library', to: 'admission-cell', distance: 145 },
  { from: 'library', to: 'auditorium', distance: 130 },
  { from: 'library', to: 'swimming-pool', distance: 220 },
  { from: 'library', to: 'cse-department', distance: 155 },
  { from: 'library', to: 'department-cell', distance: 170 },
  { from: 'admission-cell', to: 'main-gate-1', distance: 210 },
  { from: 'admission-cell', to: 'tpo-cell', distance: 90 },
  { from: 'admission-cell', to: 'auditorium', distance: 230 },
  { from: 'main-gate-1', to: 'tpo-cell', distance: 180 },
  { from: 'tpo-cell', to: 'cse-department', distance: 140 },
  { from: 'tpo-cell', to: 'programming-lab', distance: 140 },

  // Sports quarter
  { from: 'auditorium', to: 'swimming-pool', distance: 195 },
  { from: 'swimming-pool', to: 'ground-1', distance: 130 },
  { from: 'swimming-pool', to: 'ground-2', distance: 155 },
  { from: 'ground-1', to: 'ground-2', distance: 160 },
  { from: 'ground-2', to: 'volleyball-ground', distance: 125 },
  { from: 'swimming-pool', to: 'volleyball-ground', distance: 120 },
  { from: 'swimming-pool', to: 'kabaddi-ground', distance: 180 },
  { from: 'volleyball-ground', to: 'kabaddi-ground', distance: 130 },
  { from: 'ground-1', to: 'library', distance: 260 },

  // Team offices and central academic links
  { from: 'auditorium', to: 'department-cell', distance: 105 },
  { from: 'auditorium', to: 'civil-department', distance: 165 },
  { from: 'department-cell', to: 'cse-department', distance: 120 },
  { from: 'department-cell', to: 'ee-department', distance: 140 },
  { from: 'department-cell', to: 'civil-department', distance: 160 },
  { from: 'department-cell', to: 'mechanical-department', distance: 230 },

  // CSE department and laboratories
  { from: 'cse-department', to: 'programming-lab', distance: 95 },
  { from: 'cse-department', to: 'data-structures-lab', distance: 80 },
  { from: 'cse-department', to: 'computer-networks-lab', distance: 85 },
  { from: 'cse-department', to: 'ai-ml-lab', distance: 165 },
  { from: 'cse-department', to: 'ee-department', distance: 140 },
  { from: 'programming-lab', to: 'data-structures-lab', distance: 100 },
  { from: 'data-structures-lab', to: 'computer-networks-lab', distance: 70 },
  { from: 'data-structures-lab', to: 'ai-ml-lab', distance: 90 },
  { from: 'computer-networks-lab', to: 'ee-department', distance: 100 },
  { from: 'ai-ml-lab', to: 'power-systems-lab', distance: 100 },

  // EE department and laboratories
  { from: 'ee-department', to: 'electrical-machines-lab', distance: 80 },
  { from: 'ee-department', to: 'power-systems-lab', distance: 70 },
  { from: 'ee-department', to: 'electronics-lab', distance: 90 },
  { from: 'ee-department', to: 'civil-department', distance: 170 },
  { from: 'electrical-machines-lab', to: 'power-systems-lab', distance: 95 },
  { from: 'electronics-lab', to: 'civil-department', distance: 140 },

  // Civil department and laboratories
  { from: 'civil-department', to: 'surveying-lab', distance: 110 },
  { from: 'civil-department', to: 'structural-engineering-lab', distance: 100 },
  { from: 'civil-department', to: 'geotechnical-engineering-lab', distance: 90 },
  { from: 'surveying-lab', to: 'auditorium', distance: 260 },
  { from: 'structural-engineering-lab', to: 'geotechnical-engineering-lab', distance: 95 },
  { from: 'civil-department', to: 'mechanical-department', distance: 160 },

  // Mechanical department and laboratories
  { from: 'mechanical-department', to: 'workshop-lab', distance: 85 },
  { from: 'mechanical-department', to: 'thermodynamics-lab', distance: 85 },
  { from: 'mechanical-department', to: 'fluid-mechanics-lab', distance: 80 },
  { from: 'structural-engineering-lab', to: 'mechanical-department', distance: 120 },
  { from: 'workshop-lab', to: 'structural-engineering-lab', distance: 160 },
  { from: 'workshop-lab', to: 'thermodynamics-lab', distance: 110 },
  { from: 'thermodynamics-lab', to: 'fluid-mechanics-lab', distance: 95 },
  { from: 'thermodynamics-lab', to: 'geotechnical-engineering-lab', distance: 120 },
  { from: 'geotechnical-engineering-lab', to: 'fluid-mechanics-lab', distance: 120 },

  // East gate
  { from: 'main-gate-3', to: 'mechanical-department', distance: 200 },
  { from: 'main-gate-3', to: 'workshop-lab', distance: 140 },
  { from: 'main-gate-3', to: 'fluid-mechanics-lab', distance: 150 },
  { from: 'main-gate-3', to: 'thermodynamics-lab', distance: 180 },
]

export const campusNodeById = new Map(campusNodes.map((node) => [node.id, node]))

export const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]))

export const campusAdjacency = (() => {
  const adjacency = new Map<string, AdjacentLocation[]>(
    campusNodes.map((node) => [node.id, []]),
  )

  for (const edge of campusEdges) {
    const from = campusNodeById.get(edge.from)
    const to = campusNodeById.get(edge.to)
    if (!from || !to) continue

    adjacency.get(from.id)?.push({ node: to, distance: edge.distance })
    if (!edge.directed) {
      adjacency.get(to.id)?.push({ node: from, distance: edge.distance })
    }
  }

  for (const neighbors of adjacency.values()) {
    neighbors.sort((a, b) => a.node.name.localeCompare(b.node.name))
  }

  return adjacency
})()

export function getNeighbors(nodeId: string): AdjacentLocation[] {
  return campusAdjacency.get(nodeId) ?? []
}

export function getEdgeDistance(fromId: string, toId: string): number | null {
  const edge = campusEdges.find(
    (candidate) =>
      (candidate.from === fromId && candidate.to === toId) ||
      (!candidate.directed &&
        candidate.from === toId &&
        candidate.to === fromId),
  )
  return edge?.distance ?? null
}

/** Graph-level checks used by the app and useful when the dataset is edited. */
export function validateCampusGraph() {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const node of campusNodes) {
    if (ids.has(node.id)) errors.push(`Duplicate node id: ${node.id}`)
    ids.add(node.id)
  }

  const seenPairs = new Set<string>()
  const adjacency = new Map<string, string[]>(campusNodes.map((node) => [node.id, []]))

  for (const edge of campusEdges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      errors.push(`Edge references a missing location: ${edge.from} → ${edge.to}`)
      continue
    }
    if (!Number.isFinite(edge.distance)) {
      errors.push(`Non-finite edge weight: ${edge.from} → ${edge.to}`)
    }
    if (edge.distance < 0) {
      errors.push(`Negative edge weight: ${edge.from} → ${edge.to}`)
    }
    const pairKey = [edge.from, edge.to].sort().join('::')
    if (seenPairs.has(pairKey)) {
      errors.push(`Duplicate connection: ${edge.from} ↔ ${edge.to}`)
    }
    seenPairs.add(pairKey)
    adjacency.get(edge.from)?.push(edge.to)
    if (!edge.directed) adjacency.get(edge.to)?.push(edge.from)
  }

  const start = campusNodes[0]?.id
  const visited = new Set<string>()
  if (start) {
    const queue = [start]
    visited.add(start)
    while (queue.length) {
      const current = queue.shift()!
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }
  }

  if (visited.size !== campusNodes.length) {
    const unreachable = campusNodes.filter((node) => !visited.has(node.id)).map((node) => node.name)
    errors.push(`Graph is disconnected. Unreachable: ${unreachable.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    nodeCount: campusNodes.length,
    edgeCount: campusEdges.length,
    isConnected: visited.size === campusNodes.length,
  }
}

export const CAMPUS_MAP_WIDTH = 1280
export const CAMPUS_MAP_HEIGHT = 900

export const SAMPLE_DATA_NOTE =
  'Distances are configurable sample values for algorithm demonstration, not surveyed college measurements.'
