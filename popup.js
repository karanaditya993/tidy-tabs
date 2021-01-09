(()  => {
  const closeBtn          = document.getElementById('close')
  const GET_DOMAIN_REGEX  = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img
  let tabsData            = []

  const getDomainFromUrl = (url) => {
    const a = document.createElement('a')
    a.className = 'delete'
    a.setAttribute('href', url);
    return a.hostname;
  }

  const partitionTabs = (tabs) => {
    tabs.map((tab) => {
      const matchedUrl = tab.url.match(GET_DOMAIN_REGEX)[0]
      const sameTab    = tabsData.find(t => t.url === matchedUrl)
      if (sameTab) {
        sameTab.tabIds.push(tab.id)
      } else {
        tabsData.push({
          icon: tab.favIconUrl,
          name: getDomainFromUrl(tab.url),
          tabIds: [tab.id],
          url: matchedUrl,
        })
      }
    })
    renderTabList(tabsData)
  }

  const renderTabList = (tabsData) => {
    const tabsEl = document.getElementsByClassName('tabs')[0]
    tabsData.map((tab, idx) => {
      const tabEl       = document.createElement('div')
      tabEl.className   = 'tab'
      const checkboxEl  = document.createElement('input')
      checkboxEl.name   = 'tab'
      checkboxEl.type   = "checkbox"
      checkboxEl.id     = idx
      checkboxEl.value  = tab.url
      checkboxEl.dataset.tabIds = tab.tabIds.join(',')
      const favicon     = document.createElement('img')
      favicon.src       = tab.icon
      const label       = document.createElement('label')
      label.htmlFor     = checkboxEl.id
      label.innerHTML   = `<span>${tab.name}</span> <span>(${tab.tabIds.length})</span>`
      tabEl.appendChild(checkboxEl)
      tabEl.appendChild(favicon)
      tabEl.appendChild(label)
      tabsEl.appendChild(tabEl)
    })
  }

  closeBtn.addEventListener('click', () => {
    const checkedTabIds = [...document.querySelectorAll('input[name=tab]:checked')]
                            .map(box => box.dataset.tabIds.split(',')
                            .map(val => Number(val)))
                            .flat()
    chrome.tabs.remove(checkedTabIds, () => {
      window.location.reload()
    })
  })

  window.onload = () => {
    chrome.tabs.query({}, partitionTabs)
  }
})()
