<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-slate-400">多文本回归面板</h3>
      <span class="text-xs text-slate-500">每行一条 · 前缀 <code class="text-cyan-400">+</code> 预期匹配 / <code class="text-red-400">-</code> 预期不匹配</span>
    </div>

    <textarea
      v-model="store.batchInput"
      @keyup.ctrl.enter="store.runBatch"
      placeholder="每行输入一条测试文本...&#10;+ user@example.com&#10;- invalid-email&#10;admin@mail.org"
      rows="6"
      class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500 resize-y"
    ></textarea>

    <div class="flex flex-wrap items-center gap-2 mt-3">
      <button @click="store.runBatch" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold text-sm">运行回归</button>
      <button @click="loadSample" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm">载入示例</button>
      <button @click="store.clearBatch" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 text-sm">清空</button>
      <label class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm cursor-pointer">
        导入文件
        <input type="file" accept=".txt,.json" @change="handleFileImport" class="hidden" />
      </label>
      <div class="flex-1"></div>
      <template v-if="store.batchResult">
        <button v-if="store.batchResult.anomalies.length > 0" @click="store.appendAnomaliesToInput" class="px-3 py-2 bg-orange-700 hover:bg-orange-600 rounded-lg text-white text-sm">追加异常到输入</button>
        <button v-if="store.batchResult.anomalies.length > 0" @click="store.exportAnomaliesAsText" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm">导出异常</button>
        <button @click="store.exportResultAsJSON" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm">导出JSON</button>
      </template>
      <span v-if="store.batchResult" class="text-xs text-slate-500">共 {{ store.batchResult.total }} 条 · 总耗时 {{ totalDuration }}ms</span>
    </div>

    <div v-if="store.error" class="mt-3 text-red-400 text-sm">⚠ {{ store.error }}</div>

    <div v-if="store.batchResult && store.batchResult.total > 0" class="mt-4 space-y-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-500">{{ store.batchResult.hasExpectations ? '准确率' : '命中率' }}</div>
          <div class="text-2xl font-bold text-cyan-400">{{ store.batchResult.hasExpectations ? store.batchResult.accuracy : store.batchResult.hitRate }}%</div>
        </div>
        <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-500">匹配成功</div>
          <div class="text-2xl font-bold text-green-400">{{ store.batchResult.matchedCount }}</div>
        </div>
        <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-500">未匹配</div>
          <div class="text-2xl font-bold text-red-400">{{ store.batchResult.unmatchedCount }}</div>
        </div>
        <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-500">异常样例</div>
          <div class="text-2xl font-bold" :class="store.batchResult.anomalies.length > 0 ? 'text-orange-400' : 'text-slate-300'">{{ store.batchResult.anomalies.length }}</div>
        </div>
        <template v-if="store.batchResult.hasExpectations">
          <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <div class="text-xs text-slate-500">精确率</div>
            <div class="text-2xl font-bold text-emerald-400">{{ store.batchResult.precision }}%</div>
          </div>
          <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <div class="text-xs text-slate-500">召回率</div>
            <div class="text-2xl font-bold text-blue-400">{{ store.batchResult.recall }}%</div>
          </div>
          <div class="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <div class="text-xs text-slate-500">F1分数</div>
            <div class="text-2xl font-bold text-purple-400">{{ store.batchResult.f1Score }}%</div>
          </div>
        </template>
      </div>

      <template v-if="store.batchResult.hasExpectations">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-slate-900 rounded-lg p-3 border border-green-900/50">
            <div class="text-xs text-green-500 mb-1">✓ TP 正确匹配</div>
            <div class="text-xl font-bold text-green-400">{{ store.batchResult.truePositives }}</div>
          </div>
          <div class="bg-slate-900 rounded-lg p-3 border border-cyan-900/50">
            <div class="text-xs text-cyan-500 mb-1">✓ TN 正确未匹配</div>
            <div class="text-xl font-bold text-cyan-400">{{ store.batchResult.trueNegatives }}</div>
          </div>
          <div class="bg-slate-900 rounded-lg p-3 border border-orange-900/50">
            <div class="text-xs text-orange-500 mb-1">✗ FP 误匹配</div>
            <div class="text-xl font-bold text-orange-400">{{ store.batchResult.falsePositiveCount }}</div>
          </div>
          <div class="bg-slate-900 rounded-lg p-3 border border-red-900/50">
            <div class="text-xs text-red-500 mb-1">✗ FN 漏匹配</div>
            <div class="text-xl font-bold text-red-400">{{ store.batchResult.falseNegativeCount }}</div>
          </div>
        </div>
      </template>

      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-bold text-slate-500">命中率分组</h4>
          <div class="flex gap-2">
            <button @click="groupingMode = 'simple'" :class="groupingMode === 'simple' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'" class="px-2 py-1 rounded text-xs">简单</button>
            <button @click="groupingMode = 'detailed'" :class="groupingMode === 'detailed' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'" class="px-2 py-1 rounded text-xs">详细</button>
          </div>
        </div>
        <div class="space-y-2">
          <div v-for="g in currentGroups" :key="g.label" class="flex items-center gap-3">
            <span class="inline-block w-3 h-3 rounded flex-shrink-0" :style="{ backgroundColor: g.color }"></span>
            <span class="text-sm text-slate-300 w-36 flex-shrink-0 truncate" :title="g.label">{{ g.label }}</span>
            <div class="flex-1 h-2 bg-slate-900 rounded overflow-hidden relative">
              <div class="h-full rounded transition-all duration-500" :style="{ width: g.percent + '%', backgroundColor: g.color }"></div>
            </div>
            <span class="text-sm text-slate-400 w-24 text-right flex-shrink-0 font-mono">{{ g.count }} ({{ g.percent }}%)</span>
          </div>
        </div>
      </div>

      <div v-if="store.batchResult.anomalies.length > 0" class="border border-orange-900/50 rounded-lg bg-orange-950/20 p-3">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-bold text-orange-400">⚠ 异常样例 ({{ store.batchResult.anomalies.length }})</h4>
          <button v-if="store.batchResult.anomalies.length > 0" @click="store.copyAnomaliesToClipboard" class="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300">复制到剪贴板</button>
        </div>
        <div class="flex gap-2 mb-2">
          <button @click="anomalyFilter = 'all'" :class="anomalyFilter === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'" class="px-2 py-1 rounded text-xs">全部</button>
          <button @click="anomalyFilter = 'fp'" :class="anomalyFilter === 'fp' ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'" class="px-2 py-1 rounded text-xs">误匹配 (FP)</button>
          <button @click="anomalyFilter = 'fn'" :class="anomalyFilter === 'fn' ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400'" class="px-2 py-1 rounded text-xs">漏匹配 (FN)</button>
        </div>
        <div class="space-y-1 max-h-56 overflow-y-auto">
          <div v-for="a in filteredAnomalies" :key="a.id" class="flex items-center gap-2 text-sm bg-slate-900 rounded px-2 py-1.5 group">
            <span class="text-xs px-1.5 py-0.5 rounded flex-shrink-0" :class="a.matched ? 'bg-orange-900 text-orange-300' : 'bg-red-900 text-red-300'">{{ a.matched ? '误匹配' : '漏匹配' }}</span>
            <span class="text-slate-500 text-xs flex-shrink-0">预期{{ a.expected ? '匹配' : '不匹配' }}</span>
            <span class="text-slate-200 font-mono truncate flex-1">{{ a.text }}</span>
            <span v-if="a.matched" class="text-cyan-400 font-mono text-xs truncate max-w-[30%] flex-shrink-0">匹配: {{ a.matchText }}</span>
            <button @click="inspectItem(a)" class="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-opacity">查看</button>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-bold text-slate-500">全部结果 ({{ store.batchResult.total }})</h4>
          <div class="flex gap-2 items-center">
            <select v-model="resultFilter" class="bg-slate-700 text-slate-300 text-xs rounded px-2 py-1 border border-slate-600 focus:outline-none">
              <option value="all">全部</option>
              <option value="matched">匹配成功</option>
              <option value="unmatched">未匹配</option>
              <option v-if="store.batchResult.hasExpectations" value="tp">正确匹配(TP)</option>
              <option v-if="store.batchResult.hasExpectations" value="tn">正确未匹配(TN)</option>
              <option v-if="store.batchResult.hasExpectations" value="fp">误匹配(FP)</option>
              <option v-if="store.batchResult.hasExpectations" value="fn">漏匹配(FN)</option>
              <option value="noexp-matched">无预期-匹配</option>
              <option value="noexp-unmatched">无预期-未匹配</option>
            </select>
            <input v-model="searchText" type="text" placeholder="搜索文本..." class="bg-slate-700 text-slate-300 text-xs rounded px-2 py-1 w-40 border border-slate-600 focus:outline-none focus:border-cyan-500" />
          </div>
        </div>
        <div class="space-y-1 max-h-72 overflow-y-auto">
          <div v-for="item in filteredResults" :key="item.id" class="flex items-center gap-2 text-sm bg-slate-900 rounded px-2 py-1.5 group">
            <span class="text-xs w-5 text-center flex-shrink-0 font-mono" :class="getResultClass(item)">{{ getResultIcon(item) }}</span>
            <span class="text-xs text-slate-500 w-14 flex-shrink-0 font-mono">{{ getResultTag(item) }}</span>
            <span class="text-slate-200 font-mono truncate flex-1" :title="item.text">{{ item.text }}</span>
            <span v-if="item.matched" class="text-cyan-400 font-mono text-xs truncate max-w-[35%] flex-shrink-0" :title="item.matchText">{{ item.matchText }}</span>
            <span class="text-slate-600 text-xs w-12 text-right flex-shrink-0 font-mono">{{ item.duration }}ms</span>
          </div>
        </div>
        <div v-if="filteredResults.length === 0" class="text-center text-slate-500 text-sm py-4">无匹配的结果</div>
      </div>
    </div>
    <div v-else-if="store.batchResult && store.batchResult.total === 0" class="mt-4 text-slate-500 text-sm">未录入有效文本</div>
    <div v-else class="mt-4 text-slate-500 text-sm">输入多条文本后点击"运行回归"（或 Ctrl + Enter）</div>

    <div v-if="inspectedItem" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="inspectedItem = null">
      <div class="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 class="text-lg font-bold text-cyan-400">测试用例详情</h3>
          <button @click="inspectedItem = null" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div class="p-4 space-y-3 text-sm">
          <div>
            <span class="text-slate-500">测试文本：</span>
            <div class="mt-1 bg-slate-900 rounded p-2 font-mono text-cyan-300 break-all">{{ inspectedItem.text }}</div>
          </div>
          <div class="flex gap-4">
            <div><span class="text-slate-500">预期结果：</span><span :class="inspectedItem.expected === true ? 'text-green-400' : inspectedItem.expected === false ? 'text-red-400' : 'text-slate-400'">{{ inspectedItem.expected === true ? '匹配' : inspectedItem.expected === false ? '不匹配' : '未设置' }}</span></div>
            <div><span class="text-slate-500">实际结果：</span><span :class="inspectedItem.matched ? 'text-green-400' : 'text-red-400'">{{ inspectedItem.matched ? '匹配成功' : '未匹配' }}</span></div>
          </div>
          <div v-if="inspectedItem.matched">
            <span class="text-slate-500">匹配到的文本：</span>
            <div class="mt-1 bg-green-900/30 rounded p-2 font-mono text-green-300 break-all border border-green-800">{{ inspectedItem.matchText }}</div>
          </div>
          <div v-if="inspectedItem.matched && inspectedItem.groups.length > 1" class="space-y-1">
            <span class="text-slate-500">捕获分组：</span>
            <div v-for="(g, idx) in inspectedItem.groups" :key="idx" class="bg-slate-900 rounded p-1.5 font-mono flex gap-2">
              <span class="text-slate-500 w-16 flex-shrink-0">$${{ idx }}:</span>
              <span class="text-cyan-300 break-all">{{ g || '(空)' }}</span>
            </div>
          </div>
          <div class="flex gap-4 text-slate-500">
            <div>耗时：<span class="text-slate-300">{{ inspectedItem.duration }}ms</span></div>
            <div>行号：<span class="text-slate-300">#{{ inspectedItem.id + 1 }}</span></div>
          </div>
          <div class="flex gap-2 pt-2">
            <button @click="useAsTestString" class="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-sm">作为单测文本</button>
            <button v-if="isAnomaly(inspectedItem)" @click="fixInInput" class="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-white text-sm">修正输入前缀</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRegexStore } from '../store/regex'
import type { BatchTestItem } from '../types'

const store = useRegexStore()

const groupingMode = ref<'simple' | 'detailed'>('simple')
const anomalyFilter = ref<'all' | 'fp' | 'fn'>('all')
const resultFilter = ref('all')
const searchText = ref('')
const inspectedItem = ref<BatchTestItem | null>(null)

const totalDuration = computed(() => {
  if (!store.batchResult) return 0
  return Math.round(store.batchResult.items.reduce((s, i) => s + i.duration, 0) * 100) / 100
})

const currentGroups = computed(() => {
  if (!store.batchResult) return []
  return groupingMode.value === 'simple' ? store.batchResult.groups : store.batchResult.detailedGroups
})

const filteredAnomalies = computed(() => {
  if (!store.batchResult) return []
  if (anomalyFilter.value === 'all') return store.batchResult.anomalies
  if (anomalyFilter.value === 'fp') return store.batchResult.falsePositives
  return store.batchResult.falseNegatives
})

const filteredResults = computed(() => {
  if (!store.batchResult) return []
  let list = store.batchResult.items
  const stats = store.batchResult.detailedStats
  switch (resultFilter.value) {
    case 'matched': list = list.filter(i => i.matched); break
    case 'unmatched': list = list.filter(i => !i.matched); break
    case 'tp': list = stats.matchedExpected; break
    case 'tn': list = stats.unmatchedUnexpected; break
    case 'fp': list = stats.matchedUnexpected; break
    case 'fn': list = stats.unmatchedExpected; break
    case 'noexp-matched': list = stats.noExpectationMatched; break
    case 'noexp-unmatched': list = stats.noExpectationUnmatched; break
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(i => i.text.toLowerCase().includes(q) || i.matchText.toLowerCase().includes(q))
  }
  return list
})

function getResultClass(item: BatchTestItem) {
  if (item.expected === null) return item.matched ? 'text-indigo-400' : 'text-slate-500'
  return item.matched === item.expected ? 'text-green-400' : item.matched ? 'text-orange-400' : 'text-red-400'
}

function getResultIcon(item: BatchTestItem) {
  if (item.expected === null) return item.matched ? '?' : '?'
  return item.matched === item.expected ? '✓' : '✗'
}

function getResultTag(item: BatchTestItem) {
  if (item.expected === true && item.matched === true) return '(TP)'
  if (item.expected === false && item.matched === false) return '(TN)'
  if (item.expected === false && item.matched === true) return '(FP)'
  if (item.expected === true && item.matched === false) return '(FN)'
  if (item.expected === null && item.matched === true) return '(+?)'
  if (item.expected === null && item.matched === false) return '(-?)'
  return '(?)'
}

function isAnomaly(item: BatchTestItem) {
  return item.expected !== null && item.matched !== item.expected
}

function inspectItem(item: BatchTestItem) {
  inspectedItem.value = item
}

function useAsTestString() {
  if (!inspectedItem.value) return
  store.setTestString(inspectedItem.value.text)
  inspectedItem.value = null
}

function fixInInput() {
  if (!inspectedItem.value || !isAnomaly(inspectedItem.value)) return
  const lines = store.batchInput.split('\n')
  const targetLine = lines[inspectedItem.value.id]
  if (targetLine) {
    const correctPrefix = inspectedItem.value.matched ? '- ' : '+ '
    const stripped = targetLine.replace(/^[+-]\s*/, '')
    lines[inspectedItem.value.id] = correctPrefix + stripped
    store.batchInput = lines.join('\n')
  }
  inspectedItem.value = null
}

function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(content)
        if (Array.isArray(data.items)) {
          const lines = data.items.map((it: any) => {
            if (it.expected === true) return '+ ' + it.text
            if (it.expected === false) return '- ' + it.text
            return it.text
          })
          store.batchInput = lines.join('\n')
        }
        if (data.pattern) store.setPattern(data.pattern)
        store.runBatch()
      } catch {
        store.batchInput = content
      }
    } else {
      store.batchInput = content
      store.runBatch()
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function loadSample() {
  store.batchInput = '+ user@example.com\n+ admin@mail.org\n+ test.user+tag@sub.domain.co.uk\n- invalid-email\n- @no-user.com\n- missing@tld\nhello@world.com\n+ 12345@qq.com\n- plaintext'
  store.runBatch()
}
</script>
