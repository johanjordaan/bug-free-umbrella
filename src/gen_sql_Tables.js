run_id = 'fbe9d95d-72a5-48a6-95b6-86fe4fdf39e6'
group_name = 'test_1'

let run_data = require(`../data/${run_id}/${run_id}.json`)

sql = ''

sql += `INSERT INTO tables.groups VALUES ('${run_id}','${group_name}',now());\n`;

run_data.ids.forEach(id=>{
    sql += `INSERT INTO tables.users VALUES ('${id}','','${run_id}',0,now());\n`;
})

console.log(sql)