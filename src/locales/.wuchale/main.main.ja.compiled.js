
                /** @type import('wuchale').CompiledElement[] */
export let c = ["Welcome to Roka 🎉","SvelteKit","Vitest","Roka","CSV Studio","CSVファイルをここにドロップ","File drop zone","またはクリックしてファイルを選択"]
                // only during dev, for HMR
                let latestVersion = -1
                // @ts-ignore
                export function update({ version, data }) {
                    if (latestVersion >= version) {
                        return
                    }
                    for (const [ index, item ] of data['ja'] ?? []) {
                        c[index] = item
                    }
                    latestVersion = version
                }
            