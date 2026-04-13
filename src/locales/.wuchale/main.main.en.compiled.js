
                /** @type import('wuchale').CompiledElement[] */
export let c = ["Welcome to Roka 🎉","SvelteKit","Vitest","Roka","CSV Studio","Drop any CSV here","File drop zone","Or click Import CSV to browse"]
                // only during dev, for HMR
                let latestVersion = -1
                // @ts-ignore
                export function update({ version, data }) {
                    if (latestVersion >= version) {
                        return
                    }
                    for (const [ index, item ] of data['en'] ?? []) {
                        c[index] = item
                    }
                    latestVersion = version
                }
            