import path from 'path';
import fs from 'fs';
import process from 'process';
import { getVersionMaps, findDepPackageJson } from '../utils/package-info';
import { getConfigContext } from './configuration-context';
import { logger } from '../utils/logger';
import {
  isInSkipList,
  prepareSkipList,
  DEFAULT_SKIP_LIST,
  PREPARED_DEFAULT_SKIP_LIST,
} from '../core/default-skip-list';

let inferVersion = false;
export const DEFAULT_SECONARIES_SKIP_LIST = [
  '@angular/router/upgrade',
  '@angular/common/upgrade',
];

export function findRootTsConfigJson() {
  const packageJson = findPackageJson(process.cwd());
  const projectRoot = path.dirname(packageJson);
  const tsConfigBaseJson = path.join(projectRoot, 'tsconfig.base.json');
  const tsConfigJson = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsConfigBaseJson)) {
    return tsConfigBaseJson;
  } else if (fs.existsSync(tsConfigJson)) {
    return tsConfigJson;
  }
  throw new Error('Neither a tsconfig.json nor a tsconfig.base.json was found');
}

export function findPackageJson(folder) {
  while (
    !fs.existsSync(path.join(folder, 'package.json')) &&
    path.dirname(folder) !== folder
  ) {
    folder = path.dirname(folder);
  }
  const filePath = path.join(folder, 'package.json');
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  throw new Error(
    'no package.json found. Searched the following folder and all parents: ' +
      folder,
  );
}

export function lookupVersion(key, workspaceRoot) {
  const versionMaps = getVersionMaps(workspaceRoot, workspaceRoot);
  for (const versionMap of versionMaps) {
    const version = lookupVersionInMap(key, versionMap);
    if (version) {
      return version;
    }
  }
  throw new Error(
    `Shared Dependency ${key} has requiredVersion:'auto'. However, this dependency is not found in your package.json`,
  );
}

export function lookupVersionInMap(key, versions) {
  const parts = key.split('/');
  if (parts.length >= 2 && parts[0].startsWith('@')) {
    key = parts[0] + '/' + parts[1];
  } else {
    key = parts[0];
  }
  if (key.toLowerCase() === '@angular-architects/module-federation-runtime') {
    key = '@angular-architects/module-federation';
  }
  if (!versions[key]) {
    return null;
  }
  return versions[key];
}

export function _findSecondaries(libPath, excludes, shareObject, acc) {
  const files = fs.readdirSync(libPath);
  const dirs = files
    .map((f) => path.join(libPath, f))
    .filter((f) => fs.lstatSync(f).isDirectory() && f !== 'node_modules');
  const secondaries = dirs.filter((d) =>
    fs.existsSync(path.join(d, 'package.json')),
  );
  for (const s of secondaries) {
    const secondaryLibName = s
      .replace(/\\/g, '/')
      .replace(/^.*node_modules[/]/, '');
    if (excludes.includes(secondaryLibName)) {
      continue;
    }
    if (isInSkipList(secondaryLibName, PREPARED_DEFAULT_SKIP_LIST)) {
      continue;
    }
    acc[secondaryLibName] = Object.assign({}, shareObject);
    _findSecondaries(s, excludes, shareObject, acc);
  }
}

export function findSecondaries(libPath, excludes, shareObject) {
  const acc = {};
  _findSecondaries(libPath, excludes, shareObject, acc);
  return acc;
}

export function getSecondaries(includeSecondaries, libPath, key, shareObject) {
  let exclude = [...DEFAULT_SECONARIES_SKIP_LIST];
  if (typeof includeSecondaries === 'object') {
    if (Array.isArray(includeSecondaries.skip)) {
      exclude = includeSecondaries.skip;
    } else if (typeof includeSecondaries.skip === 'string') {
      exclude = [includeSecondaries.skip];
    }
  }
  if (!fs.existsSync(libPath)) {
    return {};
  }
  const configured = readConfiguredSecondaries(
    key,
    libPath,
    exclude,
    shareObject,
  );
  if (configured) {
    return configured;
  }
  // Fallback: Search folders
  const secondaries = findSecondaries(libPath, exclude, shareObject);
  return secondaries;
}

export function readConfiguredSecondaries(
  parent,
  libPath,
  exclude,
  shareObject,
) {
  const libPackageJson = path.join(libPath, 'package.json');
  if (!fs.existsSync(libPackageJson)) {
    return null;
  }
  const packageJson = JSON.parse(fs.readFileSync(libPackageJson, 'utf-8'));
  const exports = packageJson['exports'];
  if (!exports) {
    return null;
  }
  const keys = Object.keys(exports).filter(
    (key) =>
      key != '.' &&
      key != './package.json' &&
      !key.endsWith('*') &&
      (exports[key]['default'] || typeof exports[key] === 'string'),
  );
  const result = {};
  for (const key of keys) {
    // const relPath = exports[key]['default'];
    const secondaryName = path.join(parent, key).replace(/\\/g, '/');
    if (exclude.includes(secondaryName)) {
      continue;
    }
    if (isInSkipList(secondaryName, PREPARED_DEFAULT_SKIP_LIST)) {
      continue;
    }
    const entry = getDefaultEntry(exports, key);
    if (typeof entry !== 'string') {
      console.log('No entry point found for ' + secondaryName);
      continue;
    }
    if (
      (entry === null || entry === void 0 ? void 0 : entry.endsWith('.css')) ||
      (entry === null || entry === void 0 ? void 0 : entry.endsWith('.scss')) ||
      (entry === null || entry === void 0 ? void 0 : entry.endsWith('.less'))
    ) {
      continue;
    }
    result[secondaryName] = Object.assign({}, shareObject);
  }
  return result;
}

export function getDefaultEntry(exports, key) {
  var _a;
  let entry = '';
  if (typeof exports[key] === 'string') {
    entry = exports[key];
  } else {
    entry =
      (_a = exports[key]) === null || _a === void 0 ? void 0 : _a['default'];
    if (typeof entry === 'object') {
      entry = entry['default'];
    }
  }
  return entry;
}

export function shareAll(
  config = {},
  skip = DEFAULT_SKIP_LIST,
  projectPath = '',
) {
  // let workspacePath: string | undefined = undefined;
  projectPath = inferProjectPath(projectPath);
  // workspacePath = getConfigContext().workspaceRoot ?? '';
  // if (!workspacePath) {
  //   workspacePath = projectPath;
  // }
  const versionMaps = getVersionMaps(projectPath, projectPath);
  const share = {};
  for (const versions of versionMaps) {
    const preparedSkipList = prepareSkipList(skip);
    for (const key in versions) {
      if (isInSkipList(key, preparedSkipList)) {
        continue;
      }
      const inferVersion =
        !config.requiredVersion || config.requiredVersion === 'auto';
      const requiredVersion = inferVersion
        ? versions[key]
        : config.requiredVersion;
      if (!share[key]) {
        share[key] = Object.assign(Object.assign({}, config), {
          requiredVersion,
        });
      }
    }
  }
  return module.exports.share(share, projectPath);
}

export function inferProjectPath(projectPath) {
  if (!projectPath && getConfigContext().packageJson) {
    projectPath = path.dirname(getConfigContext().packageJson || '');
  }
  if (!projectPath && getConfigContext().workspaceRoot) {
    projectPath = getConfigContext().workspaceRoot || '';
  }
  if (!projectPath) {
    projectPath = process.cwd();
  }
  return projectPath;
}

export function setInferVersion(infer) {
  inferVersion = infer;
}

export function share(shareObjects, projectPath = '') {
  projectPath = inferProjectPath(projectPath);
  const packagePath = findPackageJson(projectPath);
  // const versions = readVersionMap(packagePath);
  const result = {};
  let includeSecondaries;
  for (const key in shareObjects) {
    includeSecondaries = false;
    const shareObject = shareObjects[key];
    if (
      shareObject.requiredVersion === 'auto' ||
      (inferVersion && typeof shareObject.requiredVersion === 'undefined')
    ) {
      const version = lookupVersion(key, projectPath);
      shareObject.requiredVersion = version;
      shareObject.version = version.replace(/^\D*/, '');
    }
    if (typeof shareObject.includeSecondaries === 'undefined') {
      shareObject.includeSecondaries = true;
    }
    if (shareObject.includeSecondaries) {
      includeSecondaries = shareObject.includeSecondaries;
      delete shareObject.includeSecondaries;
    }
    result[key] = shareObject;
    if (includeSecondaries) {
      const libPackageJson = findDepPackageJson(key, path.dirname(packagePath));
      if (!libPackageJson) {
        logger.error('Could not find folder containing dep ' + key);
        continue;
      }
      const libPath = path.dirname(libPackageJson);
      const secondaries = getSecondaries(
        includeSecondaries,
        libPath,
        key,
        shareObject,
      );
      if (secondaries) {
        addSecondaries(secondaries, result);
      }
    }
  }
  return result;
}

export function addSecondaries(secondaries, result) {
  for (const key in secondaries) {
    result[key] = secondaries[key];
  }
}
