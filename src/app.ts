import { createReadStream } from "fs";
import { createInterface, Interface } from "readline";

const tab = "\t";
const search = process.argv.slice(2).join(" ");

async function processTSV(path: string, callback: (line: string, rl: Interface) => any): Promise<void> {
    return new Promise(resolve => {
        const rl = createInterface({
            input: createReadStream(path),
            crlfDelay: Infinity
        }).on("line", line => {
            callback(line, rl);
        }).on("close", resolve);
    });
}

async function searchTitle(): Promise<string | void> {
    return new Promise(resolve => {
        processTSV("./data/titles.tsv", (line, rl) => {
            if (line.includes(search) && (line.includes("tvSeries") || line.includes("tvMiniSeries"))) {
                rl.close();
                resolve(line.split(tab)[0]);
            }
        });
    });
}

async function findEpisodes(titleId: string): Promise<string[][]> {
    const episodes: string[][] = [];
    return new Promise(resolve => {
        processTSV("./data/episodes.tsv", epLine => {
            const [id, parent, _season] = epLine.split(tab);
            const season = Number(_season);
            if (parent === titleId) {
                for (let i = episodes.length; i < season; i++) {
                    episodes.push([]);
                }
                episodes[season - 1].push(id);
            }
        }).then(() => resolve(episodes));
    });
}

async function findRatings(episodes: string[][]): Promise<{ [key: string]: number }> {
    const ratings: { [key: string]: number } = {};
    const eps = episodes.flat();
    return new Promise(resolve => {
        processTSV("./data/ratings.tsv", ratingLine => {
            const t0 = ratingLine.indexOf(tab);
            const id = ratingLine.substr(0, t0);
            if (eps.includes(id)) {
                ratings[id] = Number(ratingLine.substr(t0 + 1, 3));
            }
        }).then(() => resolve(ratings));
    });
}

function showResults(episodes: string[][], ratings: { [key: string]: number }) {
    console.log(`Results for ${search}:`);
    for (let i = 0; i < episodes.length; i++) {
        let sum = episodes[i].reduce((acc, id) => acc += ratings[id], 0);
        if (!isNaN(sum)) {
            console.log(`Season ${i + 1} : ${Math.round(sum / episodes[i].length * 100) / 100}`);
        }
    }
}

async function theWholeThing() {
    const id = await searchTitle();
    if (id) {
        const episodes = await findEpisodes(id);
        const ratings = await findRatings(episodes);
        showResults(episodes, ratings);
    } else {
        console.log("No title has been found. Try searching for something else.")
    }
}

theWholeThing();
