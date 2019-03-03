const electron = require("electron");
const path = require('path');
var PHE = require("print-html-element");
var caminte = require('caminte'),
    Schema = caminte.Schema,
    config = {
        driver: "sqlite3",
        database: path.join(__dirname, 'db.sqlite')
    };

var schema = new Schema(config.driver, config);
var Account = schema.define('Account', {
    id: { type: schema.Number, "null": false },
    name: { type: schema.String, "null": false },
    opening_balance: { type: schema.Number, "null": false },
    current_balance: { type: schema.Number, "null": false }
}, {
    primaryKeys: ['id']
});

var Transaction = schema.define('Transaction', {
    id: { type: schema.Number, "null": false },
    add_acc_id: { type: schema.Number, "null": false },
    sub_acc_id: { type: schema.Number, "null": false },
    amount: { type: schema.Number, "null": false },
    date: { type: schema.Date, "null": false },
    notes: { type: schema.String }
}, {
    primaryKeys: ['id']
});

const ipc = electron.ipcRenderer;
document.addEventListener("DOMContentLoaded", function() {
    console.log(__dirname);
    var Query = Account.all();
    Query.run({}, function(err, rows) {
        // your code here
        let resultEl = document.getElementById("result");
        console.log(rows);
        for (var i = 0; i < rows.length; i++) {
            // console.log(rows[i].name);
            resultEl.innerHTML += `<tr class='data-row text-center'><td class='text-center'> ${rows[i].id.toString()} </td><td class='data-name text-center'> ${rows[i].name.toString()} </td><td class='text-center'> ${rows[i].current_balance.toString()} </td><td class='text-center'><button class='btn btn-primary btn-sm' onclick='viewDetails(${rows[i].id})'>View</button></td>`;
        }
    });

});

function viewDetails(id) {
    let detailEl = document.getElementById("details");
    detailEl.innerHTML = `<tr>
                            <th class="text-center">Id</th>
                            <th class="text-center">Name</th>
                            <th class="text-center">Date</th>
                            <th class="text-center">Notes</th>
                            <th class="text-center">Added</th>
                            <th class="text-center">Subtracted</th>
                            <th class="text-center">Balance</th>
                        </tr>`;
    var trans = [];
    var _selected_id = id
    Transaction.all({
        where: {
            sub_acc_id: _selected_id
        }
    }, function(err, rows) {
        for (var i = 0; i < rows.length; i++) {
            trans.push(rows[i]);
        }
        Transaction.all({
            where: {
                add_acc_id: _selected_id
            }
        }, async function(err, rows) {
            for (var i = 0; i < rows.length; i++) {
                trans.push(rows[i]);
            }
            trans = sortByAsc(trans);
            console.log(trans);
            var selected = await Account.findById(_selected_id);
            document.getElementById('accountName').innerHTML = `( ${selected.name} )`;
            var balance = Number(selected.opening_balance);

            detailEl.innerHTML += `<tr class='data-row text-center'><td class='text-center' colspan='6'> OPENING BALANCE </td><td class='text-center'> ${balance} </td>`;

            for (var i = 0; i < trans.length; i++) {
                // console.log(trans[i].name);
                if (trans[i].add_acc_id == _selected_id) {
                    var other = await Account.findById(trans[i].sub_acc_id);
                    balance += Number(trans[i].amount);
                    detailEl.innerHTML += `<tr class='data-row text-center'><td class='text-center'>${trans[i].id.toString()} </td><td class='data-name text-center'> ${other.name.toString()} </td><td class='text-center'> ${trans[i].date.getDate() + '-' + trans[i].date.getMonth() + '-' + trans[i].date.getFullYear()} </td><td class='text-center'> ${trans[i].notes} </td><td class='text-center'> ${trans[i].amount.toString()} </td><td>-</td><td class='text-center'> ${balance} </td>`;
                } else {
                    var other = await Account.findById(trans[i].add_acc_id);
                    balance -= Number(trans[i].amount);
                    detailEl.innerHTML += `<tr class='data-row text-center'><td class='text-center'>${trans[i].id.toString()} </td><td class='data-name text-center'> ${other.name.toString()} </td><td class='text-center'> ${trans[i].date.getDate() + '-' + trans[i].date.getMonth() + '-' + trans[i].date.getFullYear()} </td><td class='text-center'> ${trans[i].notes} </td><td>-</td><td class='text-center'> ${trans[i].amount.toString()} </td><td class='text-center'> ${balance} </td>`;
                }

            }
            detailEl.innerHTML += `<tr class='data-row text-center'><td class='text-center' colspan='6'> CLOSING BALANCE </td><td class='text-center'> ${balance} </td>`;
        });
    });
}

function addTransaction(e) {
    var _addID = document.getElementById('add-account');
    var _subID = document.getElementById('sub-account');
    var _amount = document.getElementById('amount');
    var _date = document.getElementById('transaction-date');
    var _notes = document.getElementById('notes').value == '' ? '-' : document.getElementById('notes').value;
    if (_addID.value != '' && _subID.value != '' && _amount.value != '' && _date.value != '') {
        Transaction.create({
            add_acc_id: _addID.value,
            sub_acc_id: _subID.value,
            amount: _amount.value,
            date: _date.value,
            notes: _notes
        }, async function(error, result) {
            alert("Data saved"); // respond back to request
            var addAccount = await Account.findById(result.add_acc_id);
            var cr = Number(addAccount.current_balance) + Number(result.amount);
            await Account.update({
                id: addAccount.id
            }, {
                current_balance: cr
            })
            var subAccount = await Account.findById(result.sub_acc_id);
            var cr = Number(subAccount.current_balance) - Number(result.amount);
            await Account.update({
                id: subAccount.id
            }, {
                current_balance: cr
            })
            if (error != undefined)
                alert(error);
        });
    } else {
        alert('Please fill all values');
    }
    e.preventDefault();
}

function addAccount(e) {
    var _name = document.getElementById('acc-name');
    var _openingBalance = document.getElementById('acc-opening-balance');
    if (_name.value != '' && _openingBalance.value != '') {
        Account.create({
            name: _name.value,
            opening_balance: _openingBalance.value,
            current_balance: _openingBalance.value
        }).then(function(result) {
            alert("Data saved, new id: " + result.id); // respond back to request
        }).catch(function(error) {
            alert(error);
        });
    } else {
        alert('Please fill all values');
    }
    e.preventDefault();
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

function sortByAsc(array) {
    return array.sort(function(a, b) {
        var x = a.date;
        var y = b.date;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function sortByDes(array) {
    return array.sort(function(a, b) {
        var x = a.date;
        var y = b.date;
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}

function printElem() {
    PHE.printElement(document.getElementById('printDiv'));
}