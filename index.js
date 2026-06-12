#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import pc from 'picocolors';
import { Command } from 'commander';
import boxen from 'boxen';
import cliSpinners from 'cli-spinners';
import logUpdate from 'log-update';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('carbon-reaper')
  .description('Calculate the brutal carbon footprint of your node_modules.')
  .version('1.0.0')
  .parse(process.argv);

console.log(
  boxen(
    pc.green(pc.bold('🌍 CARBON REAPER')) + '\n' + pc.gray('You are melting the ice caps.'),
    { padding: 1, margin: 1, borderStyle: 'double', borderColor: 'green' }
  )
);

const cwd = process.cwd();
const nmPath = path.join(cwd, 'node_modules');

if (!fs.existsSync(nmPath)) {
  console.log(pc.green('✨ No node_modules found. You are a true environmentalist.'));
  process.exit(0);
}

// 1 GB of data transfer roughly equates to 0.06 kg of CO2e
// Source: Average estimation based on global grid intensities
const CO2_PER_MB = 0.00006; 
// To make it dramatic but loosely based in reality, we assume the folder size represents downloaded data

const run = async () => {
  let i = 0;
  const spinner = cliSpinners.earth;
  const interval = setInterval(() => {
    logUpdate(pc.cyan(`${spinner.frames[i = ++i % spinner.frames.length]} Scanning node_modules density...`));
  }, spinner.interval);

  try {
    // fast-glob to get all files
    const entries = await fg(['node_modules/**/*'], { cwd, stats: true, onlyFiles: true });
    
    clearInterval(interval);
    logUpdate.clear();

    let totalSize = 0;
    for (const entry of entries) {
      totalSize += entry.stats.size;
    }

    const sizeMB = totalSize / (1024 * 1024);
    const co2Footprint = sizeMB * CO2_PER_MB;
    
    let judgment = "";
    if (sizeMB < 50) {
      judgment = pc.green("Barely a smudge. You care about the Earth.");
    } else if (sizeMB < 300) {
      judgment = pc.yellow("That's a lot of plastic straws you're throwing away.");
    } else if (sizeMB < 1000) {
      judgment = pc.red("You single-handedly caused a localized drought.");
    } else {
      judgment = pc.bgRed(pc.white(" YOU ARE ACTIVELY DESTROYING THE OZONE LAYER. "));
    }

    console.log(pc.white(`Directory scanned: `) + pc.cyan(nmPath));
    console.log(pc.white(`Total files:       `) + pc.yellow(entries.length.toLocaleString()));
    console.log(pc.white(`Total weight:      `) + pc.yellow(`${sizeMB.toFixed(2)} MB`));
    console.log();
    
    console.log(
      boxen(
        pc.red(`🔥 CARBON FOOTPRINT: ${co2Footprint.toFixed(4)} kg CO2e 🔥\n`) + judgment,
        { padding: 1, borderStyle: 'round', borderColor: 'red' }
      )
    );

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: pc.green('Do you want to delete node_modules to save the Earth?'),
      default: false
    }]);

    if (confirm) {
      fs.rmSync(nmPath, { recursive: true, force: true });
      console.log(pc.green('✔ Thank you. Mother Nature smiles upon you.'));
    } else {
      console.log(pc.gray('You chose convenience over the planet. Coward.'));
    }

    console.log(pc.cyan('\nArchitected by @lakshanmuruganandam\n'));

  } catch (err) {
    clearInterval(interval);
    console.error(pc.red('\nFailed to scan directory:'), err.message);
    process.exit(1);
  }
};

run();
