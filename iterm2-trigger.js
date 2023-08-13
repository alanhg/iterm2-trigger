let [, , filePath] = process.argv;
const {execSync} = require('child_process');
const fs = require('fs');

// 部分文件跳过检查，隐藏文件夹自动跳过
const SKIP_MATCH_FILES_REG = [/^\./, /^node_modules$/];

const utils = {

  /**
   * word match
   */
  wordMatch: (word) => {
    return (str) => {
      return str.match(new RegExp(`\\b${word}\\b`, 'g'));
    };
  }, matchFn: (limitLeft, filePath, suffixes) => {
    if (limitLeft <= 0) {
      return [limitLeft, false];
    }
    if (utils.isDirectory(filePath)) {
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        if (SKIP_MATCH_FILES_REG.some(reg => file.match(reg))) {
          continue;
        }
        const res = utils.matchFn(limitLeft, `${filePath}/${file}`, suffixes);
        limitLeft = res[0];
        if (res[1]) {
          return [limitLeft, true];
        }
      }
    } else {
      limitLeft = limitLeft - 1;
      if (filePath.match(new RegExp(`(${suffixes.join('|')})$`))) {
        return [limitLeft, true];
      }
    }
    return [limitLeft, false];
  },

  /**
   * 递归检查目标文件夹中是不是有命中目标后缀的文件，最多尝试N次
   * @param canRetryLimit
   * @param filePath 文件
   * @param suffixes
   */
  suffixMatch: (canRetryLimit = 10, filePath, suffixes) => {
    return utils.matchFn(canRetryLimit, filePath, suffixes)[1];
  }, checkAppExist: (app) => {
    if (app.match(/\.app$/)) {
      app = `/Applications/${app}`;
    }
    return fs.existsSync(app);
  }, isDirectory: (file) => {
    return fs.lstatSync(file).isDirectory();
  }, isFile: (file) => {
    return fs.lstatSync(file).isFile();
  },
  openApp: (app, filePath) => {
    if (app.match(/\.app$/)) {
      execSync(`open -a "${app}" "${filePath}"`);
    } else {
      execSync(`${app} "${filePath}"`);
    }
  },
  showSelector(apps = [], filePath) {
    if (apps.length === 0) {
      execSync(`open "${filePath}"`);
    } else if (apps.length === 1) {
      utils.openApp(apps[0], filePath);
    } else {
      const command = `osascript -e 'set appChoices to ${JSON.stringify(apps).replace('[', '{').replace(']', '}')}
set selectedApp to choose from list appChoices with prompt "Open with" default items {"${apps[0]}"}
tell application (item 1 of selectedApp) to open "${filePath}"
return selectedApp'`;
      return execSync(command, {encoding: 'utf8'});
    }
  }
};

/**
 * 调试脚本 ./iterm2-trigger.sh '/git/chainmaker-go'
 * 设置各种文件的默认打开程序
 * key为条件，value为执行命令，缺省使用默认打开程序
 * 项目文件夹名称命中go词汇的，使用goland打开
 */
const ruleMap = new Map();
ruleMap.set(
  (_filePath) => utils.isDirectory(_filePath) && utils.suffixMatch(10, _filePath, ['.go'])
  , 'GoLand.app');
ruleMap.set((_filePath) => utils.isFile(_filePath) && utils.suffixMatch(10, _filePath,
  ['.md']), 'Typora.app');
ruleMap.set((_filePath) => utils.isDirectory(_filePath) && utils.suffixMatch(10, _filePath,
  ['.js', '.jsx', '.ts', '.tsx', '.md']), 'WebStorm.app');
ruleMap.set((_filePath) => utils.suffixMatch(1, _filePath,
    ['.js', '.jsx', '.ts', '.tsx', '.md', '.log']),
  ['WebStorm.app',
    'Visual Studio Code - Insiders.app',
    'Visual Studio Code.app']);

function run(file) {
  let filePath = file.trim();
  const matchItem = [...ruleMap.entries()].find(([match]) => match(filePath));
  if (matchItem) {
    const supportApps = typeof matchItem[1] === 'string' ? [matchItem[1]] : matchItem[1].filter(app => utils.checkAppExist(app));
    utils.showSelector(supportApps, filePath);
  } else {
    utils.showSelector([], filePath);
  }
}

run(filePath);
