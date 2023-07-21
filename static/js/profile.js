let calendar_commits;
let last_tech_data;

function show_profile_calendar(commit_data){
    calendar_commits = commit_data;
    let today = moment().endOf('day').toDate();
    let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    let chartData = d3.time.days(yearAgo, today).map(function (dateElement) {
        return {
                date: dateElement,
                count:(calendar_commits[moment(dateElement).format('YYYY-MM-DD')] ? calendar_commits[moment(dateElement).format('YYYY-MM-DD')] : 0)
            };
        });
    let calendar = profile_calendar()
        .data(chartData)
        .selector('.git-table')
        .tooltipEnabled(true)
        .colorRange(['#c6e48b', '#196127'])
    calendar();
};

function save_global_var(tech_data){
    last_tech_data = tech_data;
}

function highlight_card_tech(event, tech_name, tech_color) {
    let cards = document.querySelectorAll('.tech_card');
    let cells = document.querySelectorAll(".day-cell");
    for (let cell of cells) {
            cell.setAttribute('selected', 'false');
            cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            cell.setAttribute('style', 'opacity:1;');
        }

    if (event.currentTarget.getAttribute('selected') == 'true') {
        event.currentTarget.setAttribute('selected', 'false');
        let selected_list = Array.from(cards).map(card => card.getAttribute('selected'));
        if (!selected_list.includes('true')){
            cards.forEach(card => {
                card.setAttribute('style', 'opacity:1;');
            });
        }
        for (let cell of cells) {
            cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            cell.setAttribute('style', 'opacity:1;');
        }
        show_total_lines(last_tech_data, true);
    } else {
        for (let card of cards) {
            card.setAttribute('selected', 'false');
            card.setAttribute('style', 'opacity:0.2;');
        }

        event.currentTarget.setAttribute('selected', 'true');
        event.currentTarget.setAttribute('style', 'opacity:1;');
        let tech_commit_data = {}
        for (let cell of cells) {
            let date = cell.getAttribute('date');
            if (calendar_commits[date]?.[tech_name]){
                tech_commit_data[date] = {}
                tech_commit_data[date][tech_name] = calendar_commits[date][tech_name]
                cell.setAttribute('style', 'opacity:1;');
                cell.setAttribute('fill', tech_color);
            } else {
                cell.setAttribute('style', 'opacity:0.2;');
                cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            }
        }
        show_total_lines(tech_commit_data, true);
    }
}

function make_tech_lines(calendar_commits){
    const totals = {};
    for (const date in calendar_commits) {
      const technologies = calendar_commits[date];
      for (const technology in technologies) {
        const count = technologies[technology];
        if (totals[technology]) {
          totals[technology] += count;
        } else {
          totals[technology] = count;
        }
      }
    }
    const totalsArray = Object.entries(totals);
    totalsArray.sort((a, b) => b[1] - a[1]);
    let new_tech_lines_data  = Object.fromEntries(totalsArray);


    let new_total_lines = 0;
    for (const tech in new_tech_lines_data) {
    new_total_lines += new_tech_lines_data[tech];
    }
    return {new_tech_lines_data, new_total_lines};
}

function tech_name(tech) {
    let tech_name = tech.toLowerCase();
    tech_name = tech_name.replace('#', '_sharp');

    return tech_name
}

function show_total_lines(commit_data, is_reset=false){
    let tagArea = document.getElementById('tech_grahp');
    if (is_reset){
        tagArea.innerHTML = '';
        show_more_index = 0;
        show_more_btn.classList.remove('hidden');
    } else {
        show_more_index += 1;
    }
    current_data = commit_data;
    let full_sort_recent_list = Object.entries(commit_data).reverse();
    let sort_recent_list = full_sort_recent_list.slice(show_more_index*3, show_more_index*3+3)
    if (full_sort_recent_list.length <= 3*show_more_index+3){
        show_more_btn.classList.add('hidden');
    }
    let max_line = Math.max(...(full_sort_recent_list).map(item => Object.values(item[1])[0]));
    sort_recent_list.forEach(item => {
        let date = item[0];
        let tech_data = item[1];
        let dateObj = new Date(date);
        let day = dateObj.getDate();
        let month = dateObj.toLocaleString('en-US', {month: 'long'});
        let year = dateObj.getFullYear();
        let date_info = `
        <h3 class="h6 pr-2 py-1 border-bottom mb-3" style="height: 14px; border: none;">
        <span class="pl-2 pr-3 text-sm font-semibold" style="background-color:white">${month} ${day}<span style="font-weight: normal;">, ${year}</span>
        </span>
        </h3>
        `
        tagArea.innerHTML += date_info;

        Object.entries(tech_data).forEach(function ([tech, lines]) {
            let tech_info = `
            <div class="text-gray-700 dark:text-gray-400 tech_graph" id="tech_${tech}" style="display:flex; border: none;">
              <div class="px-3 py-3">
                <div class="flex items-center text-sm">
                  <div>
                    <img style="max-width:60px;margin-right:20px" src="/static/img/${tech_name(tech)}.png" onerror="this.onerror=null; this.src='/static/img/none3.png';" loading="lazy">
                  </div>
                  <div>
                    <p class="font-semibold">${tech}</p>
                  </div>
                </div>
              </div>
              <div style="width: 100%; display: flex; justify-content:center; align-items:center;">
                <div class="rounded-full" style="background-color:lightgray; width: 95%;">
                  <div
                    class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                    style="width: ${lines.toLocaleString()/max_line*100 < 10? 10 : lines.toLocaleString()/max_line*99}%; background-color: ${color_choice(tech, 1)};"><p style="color:white">${lines.toLocaleString()} lines</p>
                  </div>
                </div>
              </div>
            </div>`;
            tagArea.innerHTML += tech_info;
        });
    });
}

function highlight_cell(event, commits=null){
    let cells = document.querySelectorAll(".day-cell");
    let cards = document.querySelectorAll('.tech_card');
    for (let card of cards) {
        card.setAttribute('selected', 'false');
        card.setAttribute('style', 'opacity:1;');
    }

    if (event.currentTarget.getAttribute('selected') == 'true') {
        event.currentTarget.setAttribute('selected', 'false');
        let selected_cell_list = Array.from(cells).map(cell => cell.getAttribute('selected'));
        if (!selected_cell_list.includes('true')){
            cells.forEach(cell => {
                cell.setAttribute('style', 'opacity:1;');
            });
        }
        for (let cell of cells) {
            cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            cell.setAttribute('opacity', 1);
        }
        show_total_lines(last_tech_data, true);

    } else {
        for (let cell of cells) {
            cell.setAttribute('selected', 'false');
            cell.setAttribute('style', 'opacity:0.2;');
        }
        event.currentTarget.setAttribute('selected', 'true');
        event.currentTarget.setAttribute('style', 'opacity:1;');
        show_total_lines(commits, true);
    }
}
