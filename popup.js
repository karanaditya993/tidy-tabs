(()  => {
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

  const getBadgeColor = (numTabs) => {
    let color
    const badgeColors = {
      low: {
        threshold: [1, 1],
        color: '#e6e6e6' 
      },
      few: {
        threshold: [2, 2],
        color: '#d3d3d3' 
      },
      couple: {
        threshold: [3, 3],
        color: '#c3c3c4'
      },
      many: {
        threshold: [4, Infinity],
        color: '#b2b2b3'
      }
    }

    Object.values(badgeColors).map(badge => {
      if (numTabs >= badge.threshold[0] && numTabs <= badge.threshold[1]) {
        color = badge.color
      }
    })
    return color
  }

  const renderTabList = () => {
    tabsData.sort((tab1, tab2) => tab2.tabIds.length - tab1.tabIds.length)

    tabsData.map((tab, idx) => {
      if (document.getElementById('list-container').style.display !== 'none'
        && document.getElementsByClassName('list-tabs')[0].children !== tabsData.length
      ) {
        const tabsEl = document.getElementsByClassName('list-tabs')[0]
        const badgeEl     = document.createElement('div')
        const checkboxEl  = document.createElement('input')
        const favicon     = document.createElement('img')
        const label       = document.createElement('label')
        const tabEl       = document.createElement('div')

        tabEl.className   = 'tab'
        checkboxEl.name   = 'tab'
        checkboxEl.type   = 'checkbox'
        checkboxEl.id     = idx
        checkboxEl.value  = tab.url
        checkboxEl.dataset.tabIds = tab.tabIds.join(',')
        favicon.src       = tab.icon
        label.className   = 'tab-label'
        label.htmlFor     = checkboxEl.id
        label.innerHTML   = `<span class="tab-name">${tab.name}</span>`
        badgeEl.className = 'tab-badge'
        badgeEl.innerText = tab.tabIds.length
        badgeEl.style.backgroundColor = getBadgeColor(tab.tabIds.length)
        tabEl.appendChild(checkboxEl)
        tabEl.appendChild(favicon)
        tabEl.appendChild(label)
        tabEl.appendChild(badgeEl)
        tabsEl.appendChild(tabEl)
      }
    })
  }

  const addListeners = () => {
    document.body.addEventListener('click', (el) => {
      if (document.getElementById('list-container')) {
        if (el.target.className === 'tab') {
          const input = el.target.querySelector('input')
          input.checked = !input.checked
          return
        }
        if (el.target.id === 'close') {
          const checkedTabIds = [...document.querySelectorAll('input[name=tab]:checked')]
                                .map(box => box.dataset.tabIds.split(',')
                                .map(val => Number(val)))
                                .flat()
          chrome.tabs.remove(checkedTabIds, () => {
            window.location.reload()
          })
          return
        }
      }
    })
  }

  window.onload = () => {
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
