#!/usr/bin/env node

const { spawn } = require('child_process')
const prompts = require('prompts')

async function run () {
  const branches = await cmd('git branch -v --sort=-committerdate')

  if (!branches) {
    console.log('fatal: not a git repository')
    process.exit(1)
  }

  const choices = branches
    .split(/\n/)
    .filter(branch => !!branch.trim())
    .map(branch => {
      const [, flag, name, info] = branch.match(/([* ])\s+([^\s]+)\s+(.+)/)
      return {
        value: name,
        disabled: flag === '*',
        info
      }
    })

  const commits = choices.reduce((object, { value, info }) => ({
    ...object,
    [value]: info
  }), {})

  const { branch } = await prompts({
    type: 'select',
    name: 'branch',
    message: 'Select a branch',
    choices,
    initial: 0,
    hint: commits[choices[0].value],
    warn: 'Current branch',
    onState ({ value }) {
      this.hint = commits[value]
    }
  })

  await cmd(`git checkout ${branch}`)
}

function cmd (string) {
  const [ cmd, ...args ] = string.split(' ')
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)
    let data = ''
    child.stdout.on('data', buffer => {
      data += buffer.toString()
    })
    child.stdout.on('end', () => resolve(data))
    child.on('error', reject)
  })
}

run()
