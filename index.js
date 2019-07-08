#!/usr/bin/env node

const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

async function run () {
  const { stdout: localBranches } = await exec('git branch -v --sort=-committerdate')
  const { stdout: remoteBranches } = await exec('git branch -v -r')

  const remoteTrimmedBranches = remoteBranches
    .split(/\n/)
    .filter(l => !l.includes('origin/HEAD'))
    .map(l => `  ${l.split('origin/').slice(1).join('origin/')}`)

  const choices = localBranches
    .split(/\n/)
    .concat(remoteTrimmedBranches)
    .filter(branch => !!branch.trim())
    .map(branch => {
      const [, flag, value, hint] = branch.match(/([* ]) +([^ ]+) +(.+)/)
      return { value, hint, disabled: flag === '*' }
    })


  const { branch } = await prompts({
    type: 'select',
    name: 'branch',
    message: 'Switch branch',
    choices,
    hint: choices[0].hint,
    warn: 'current branch',
    onState ({ value }) {
      this.hint = choices.find(c => c.value === value).hint
    }
  })

  await checkout(branch)
}

async function checkout (branch) {
  if (!branch) return
  const { stdout, stderr } = await exec(`git checkout '${branch}'`)
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
