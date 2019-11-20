const YarnLock = require('../lib/yarn-lock.js')
const Arborist = require('../lib/arborist.js')

const t = require('tap')
const {resolve, basename} = require('path')
const fixtures = [
  resolve(__dirname, 'fixtures/tap-with-yarn-lock'),
  resolve(__dirname, 'fixtures/yarn-stuff'),
]
const {readFileSync} = require('fs')

fixtures.forEach(f => t.test(basename(f), t => {
  const lockdata = readFileSync(f + '/yarn.lock')
  const yarnLock = new YarnLock()
  // parse the data
  yarnLock.parse(lockdata)
  // then turn it into output
  const lockOutput = yarnLock.toString()
  // snapshot the result
  t.matchSnapshot(lockOutput, 'generated output from input')
  const yarnLock2 = new YarnLock()
  yarnLock2.parse(lockOutput)
  t.strictSame(yarnLock2, yarnLock, 'same parsed result from string output')
  t.end()
}))

t.test('invalid yarn lockfile data throws', t => {
  t.throws(() => YarnLock.parse(`
asdf@foo:
  this !is not vlid
            i mean
what even is it??
   not yarn lock, that's for sure
      {"maybe":"json"}?
 - or: even
 - yaml?
 - NO
`), {content: '  this !is not vlid\n', line: 3, position: 11}, 'just garbage')

  t.throws(() => YarnLock.parse(`
asdf@foo:
  dependencies:
    foo bar baz blork
`), {content: '    foo bar baz blork\n', line: 4}, 'invalid subkey')

  t.end()
})

t.test('omits empty dependency list on toString output', t => {
  const y = new YarnLock()
  y.parse(`
foo@bar:
  version "1.2.3"
  resolved "https://registry.local/foo/-/foo-1.2.3.tgz"
  dependencies:

# Note: do not require a \\n at the end of the file, just add it if missing
# Also: comments are not preserved.

bar@foo:
  version "1.2.3"`)
  t.equal(y.toString(), `# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
# yarn lockfile v1


"bar@foo":
  "version" "1.2.3"

"foo@bar":
  "resolved" "https://registry.local/foo/-/foo-1.2.3.tgz"
  "version" "1.2.3"
`)
  t.end()
})

t.test('exports YarnLockEntry class', t => {
  t.isa(YarnLock.Entry, 'function')
  t.end()
})

t.test('load a yarn lock from a tree', t => {
  const fixtures = [
    resolve(__dirname, 'fixtures/install-types'),
    resolve(__dirname, 'fixtures/links-all-over'),
  ]
  fixtures.forEach(fixture => t.test(basename(fixture), t =>
    new Arborist({root: fixture}).loadActual().then(tree => {
      const y = YarnLock.fromTree(tree)
      t.matchSnapshot(y.toString(), 'yarn.lock from a package tree')
    })))
  t.end()
})
