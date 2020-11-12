import { promises as fs } from 'fs'
import matter from 'gray-matter'

const CONTENTDIR = 'src/content'

export default function pageBuilder() {
    return {
        name: 'page-builder',
        buildStart: async () => {
            const components = await fs.readdir(`${CONTENTDIR}`)
            const imports = components.map((c, i) => `import Page${i} from './content/${c}/index.svx'`)
            const pages = components.map((c, i) => {
                const { hsl = "" } = matter.read(`${CONTENTDIR}/${c}/index.svx`).data
                const [ hue = 0, sat = 0, lum = 0] = hsl.split(' ')
                return `\n\t{ component: Page${i}, hue: ${hue}, sat: ${sat}, lum: ${lum} }`
            })

            const file = `${imports.join('\n')}\n\nexport default [${pages.join(',')}\n]`
            await fs.writeFile('src/pages.js', file)
        }
    }
}