const [, , filePath] = process.argv;
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const filename = path.basename(filePath);
// 部分文件跳过检查
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
  }, checkAppExist: (shell) => {
    try {
      execSync(`which ${shell}`);
      return true;
    } catch (error) {
      return false;
    }
  }, isDirectory: (file) => {
    return fs.lstatSync(file).isDirectory();
  }, isFile: (file) => {
    return fs.lstatSync(file).isFile();
  }
};

/**
 * 调试脚本 ./iterm2-trigger.sh '/git/chainmaker-go'
 * 设置各种文件的默认打开程序
 * key为条件，value为执行命令，缺省使用默认打开程序
 * 项目文件夹名称命中go词汇的，使用goland打开
 */
const commandMap = new Map();
commandMap.set((_filePath) => utils.isDirectory(_filePath) && utils.suffixMatch(10, _filePath, ['.go']), '/usr/local/bin/goland');
commandMap.set((_filePath) => utils.isDirectory(_filePath) && utils.suffixMatch(10, _filePath, ['.js', '.jsx', '.ts', '.tsx']), '/usr/local/bin/webstorm');
commandMap.set((_filePath) => true, 'open');

(function init() {
  let commandStr = '';
  for (const fn of commandMap.keys()) {
    if (fn(filePath)) {
      commandStr = commandMap.get(fn);
      if (utils.checkAppExist(commandStr)) {
        break;
      }
    }
  }
  execSync(`${commandStr} ${filePath}`);
})();

