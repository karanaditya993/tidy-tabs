(()  => {
  let tabsData
  const closeBtn = document.getElementById('close')

  const renderTabList = (tabs) => {
    debugger
    tabsData = tabs
    const tabsEl = document.getElementsByClassName('tabs')[0]
    tabs.map((tab) => {
      const tabEl = document.createElement('div')
      tabEl.className = 'tab'
      const checkboxEl = document.createElement('input')
      checkboxEl.name = 'tab'
      checkboxEl.type = "checkbox"
      checkboxEl.id = tab.index
      checkboxEl.value = tab.id
      const label = document.createElement('label')
      label.htmlFor = checkboxEl.id
      label.innerText = tab.title
      tabEl.appendChild(checkboxEl)
      tabEl.appendChild(label)
      tabsEl.appendChild(tabEl)
    })
  }

  closeBtn.addEventListener('click', () => {
    const checkedTabIds = [...document.querySelectorAll('input[name=tab]:checked')].map((box) => Number(box.value));
    chrome.tabs.remove(checkedTabIds)
    window.location.reload()
  })

  window.onload = () => {
    chrome.tabs.getAllInWindow(null, renderTabList)
  }
})()
