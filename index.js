#!/usr/bin/env node

const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

async function run () {
  const branches = await exec('git branch -v --sort=-committerdate')

  const choices = branches.stdout
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
    message: 'Switch branch',
    choices,
    hint: commits[choices[0].value],
    warn: 'current branch',
    onState ({ value }) {
      this.hint = commits[value]
    }
  })

  await checkout(branch)
}

async function checkout (branch) {
  if (!branch) return
  const { stdout, stderr } = await exec(`git checkout ${branch}`)
  process.stdout.write(stdout)
  process.stderr.write(stderr)
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)
