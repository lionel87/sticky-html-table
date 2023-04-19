import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import path from 'path';

const args = process.argv.slice(2);

const watch = args.includes('--watch');
const serve = args.includes('--serve');
// const production = args.includes('--env=production') || process.env.NODE_ENV === 'production';

esbuild[(watch || serve) ? 'context' : 'build']({
	logLevel: 'info',
	entryPoints: ['src/sticky-table.ts', 'src/sticky-table.scss'],
	bundle: true,
	format: 'iife',
	globalName: 'StickyTable',
	splitting: false,
	treeShaking: true,
	minify: true,
	outdir: 'browser',
	sourcemap: false,
	legalComments: 'eof',
	target: ['chrome58', 'firefox57', 'safari11', 'edge18'],
	plugins: [
		sassPlugin({
			precompile(source, pathname) {
				const basedir = path.dirname(pathname).replaceAll('\\', '/');
				return source.replace(/(url\(['"]?)(\.\.?\/)([^'")]+['"]?\))/g, `$1${basedir}/$2$3`);
			}
		}),
	],
}).then((ctx) => {
	watch && ctx.watch();
	serve && ctx.serve({
		port: 80,
		servedir: '.',
	});
});
