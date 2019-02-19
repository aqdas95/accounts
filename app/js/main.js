const electron = require("electron");
const path = require('path');
var knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: path.join(__dirname, 'db.sqlite')
    },
    useNullAsDefault: true
});

const ipc = electron.ipcRenderer;
document.addEventListener("DOMContentLoaded", function() {
    console.log(__dirname);
    let result = knex.select().from("account");
    result.then(function(rows) {
        console.log(rows);
        let resultEl = document.getElementById("result");
        console.log(result);
        for (var i = 0; i < rows.length; i++) {
            resultEl.innerHTML += "<tr class='data-row'><td>" + rows[i].id.toString() + "</td><td class='data-name'>" + rows[i].name.toString() + "</td><td>" + rows[i].opening_balance.toString() + "</td><td>" + rows[i].current_balance.toString() + "</td><td><button class='btn btn-primary'>View</button></td>";
        }
    });
});

function addTransaction() {
    var _addID = document.getElementById('add-account');
    var _subID = document.getElementById('sub-account');
    var _amount = document.getElementById('amount');
    var _date = document.getElementById('date');
    knex.table('transaction').returning('Id').insert({
        add_acc_id: _addID.value,
        sub_acc_id: _subID.value,
        amount: _amount.value,
        date: _date.value
    }).then(function(result) {
        console.log(result); // respond back to request
    }).catch(function(error) {
        console.log(error);
    });
}

function addAccount() {
    var _name = document.getElementById('acc-name');
    var _openingBalance = document.getElementById('acc-opening-balance');
    knex.table('account').returning('Id').insert({
        name: _name.value,
        opening_balance: _openingBalance.value,
        current_balance: _openingBalance.value
    }).then(function(result) {
        alert(result); // respond back to request
    }).catch(function(error) {
        alert(error);
    });
}

function searchTable() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('tableSearchInput');
    filter = input.value.toUpperCase();
    ul = document.getElementById("result");
    li = ul.getElementsByClassName('data-row');

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByClassName("data-name")[0];
        txtValue = a.innerHTML;
        console.log(filter)
        console.log(txtValue.toUpperCase().indexOf(filter) > -1)
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}