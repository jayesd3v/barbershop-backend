import path from 'path';
import fs from 'fs';
import clc from 'cli-color';

const ROOT_PATH =
    path.dirname(import.meta.url).split('/scripts/custom-loader')[0] + '/src';

export function resolveSpecifier(specifier, isDebug) {
    if (isDebug) {
        console.log('Original specifier:', clc.blue(specifier));
    }
    if (specifier.startsWith('@/')) {
        specifier = specifier.replace(/^@/, ROOT_PATH);

        if (isDebug) {
            console.log(
                'The specifier start with @/, so we replace it with ROOT_PATH:',
                clc.cyanBright(specifier),
            );
        }

        // on Windows, the path scheme won't work with lstatSync, se we remove it first
        const checkingPath =
            process.platform === 'win32'
                ? specifier.replace(/^file:(\/)+/, '')
                : specifier;

        const isExist = fs.existsSync(checkingPath);

        if (isDebug) {
            console.log('Checking path:', clc.cyanBright(checkingPath));
        }

        if (isExist && fs.lstatSync(checkingPath).isDirectory()) {
            if (isDebug) {
                console.log('Path is directory');
            }

            specifier = `${specifier}/index.js`;
        } else if (!isExist) {
            const checkingPathWithExtension = `${checkingPath}.js`;
            const isExistWithExtension = fs.existsSync(
                checkingPathWithExtension,
            );

            if (isDebug) {
                console.log(
                    `Path is not exist, try to check with .js extension: ${clc.cyanBright(
                        checkingPathWithExtension,
                    )}`,
                );
            }

            if (
                isExistWithExtension &&
                fs.lstatSync(checkingPathWithExtension).isFile()
            ) {
                if (isDebug) {
                    console.log('Path is file');
                }
                specifier = `${specifier}.js`;
            }
        }
    }

    return specifier;
}

export function resolve(specifier, parentModuleURL, defaultResolver, isDebug) {
    return defaultResolver(resolveSpecifier(specifier), parentModuleURL);
}
