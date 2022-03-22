const [, , file] = process.argv;
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const filename = path.basename(file);
const commandMap = new Map();

/**
 * 调试脚本
 * ~/bin/iterm2-trigger.sh '/git/chainmaker-go'
 */

/**
 * 设置各种文件的默认打开程序
 * key为条件，value为执行命令，缺省使用默认打开程序
 * 项目文件夹名称命中go词汇的，使用goland打开
 */
const default_app = 'open';
const default_app_for_directory = checkAppExist('/usr/local/bin/webstorm') ? '/usr/local/bin/webstorm' : default_app;

commandMap.set(() => wordMatch('go')(filename) && fs.lstatSync(file).isDirectory(), '/usr/local/bin/goland');

commandMap.set(() => fs.lstatSync(file).isDirectory(), default_app_for_directory);

(function () {
  let commandStr = `open ${file}`;
  for (const fn of commandMap.keys()) {
    if (fn(file)) {
      console.log(fn.toString());
      commandStr = commandMap.get(fn);
      break;
    }
  }
  if (fs.lstatSync(file).isDirectory() && !checkAppExist(commandStr)) {
    commandStr = default_app_for_directory;
  }
  execSync(`${commandStr} ${file}`);
})();

/**
 * word match
 */
function wordMatch(word) {
  return (str) => {
    return str.match(new RegExp(`\\b${word}\\b`, 'g'));
  };
}


/**
 * 检查目标文件是不是命中文件后缀，尝试10次有命中则认为成功
 * @param directory
 */
function suffixMatch(suffix, retryCount = 10) {
  const matchFn = (file, count) => {
    if (!fs.lstatSync(file).isDirectory()) {
      return directory.match(`${suffix}$`).length > 0;
    } else {
      const files = fs.readdirSync(file);
      for (const file of files) {
        return matchFn(file);
      }
    }
  }

  return (directory) => {
    let count = 0;
    if (!fs.lstatSync(directory).isDirectory()) {
      return directory.match(`${suffix}$`).length > 0;
    }
  }
}

function checkAppExist(shell) {
  try {
    execSync(`which ${shell}`);
    return true;
  } catch (error) {
    return false;
  }
}
