import { Command } from 'commander';
import { VERSION, NAME } from '../index.js';

const program = new Command();

program
  .name(NAME)
  .version(VERSION)
  .description('Regex-first security scanner for AI-generated code');

program.parse();
