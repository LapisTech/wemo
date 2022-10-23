const js = (await Deno.readTextFile('src/app.js')).replace(/    /g, '\t');
const html = (await Deno.readTextFile('docs/index.html')).replace(/<script>[\s\S]+?<\/script>/, `<script>${js}</script>`);
await Deno.writeTextFile('docs/index.html', html);
