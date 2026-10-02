const tableBody = document.getElementById('envelopes');
const totalEl = document.getElementById('total');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');
const createForm = document.getElementById('create-form');
const transferForm = document.getElementById('transfer-form');
const distributeForm = document.getElementById('distribute-form');
const distributeList = document.getElementById('distribute-list');
const transactionForm = document.getElementById('transaction-form');
const transactionsBody = document.getElementById('transactions');
const noTransactionsEl = document.getElementById('no-transactions');

let editingId = null;

const money = (value) => '$' + value.toFixed(2);
const today = () => new Date().toLocaleDateString('en-CA');

async function request(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function update(action) {
  showError('');
  try {
    await action();
    await load();
  } catch (err) {
    showError(err.message);
  }
}

function button(text, className, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.className = className;
  btn.addEventListener('click', onClick);
  return btn;
}

function input(type, value) {
  const el = document.createElement('input');
  el.type = type;
  el.value = value;
  if (type === 'number') {
    el.min = '0';
    el.step = '0.01';
  }
  return el;
}

function viewRow(envelope) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td></td>
    <td class="money">${money(envelope.budget)}</td>
    <td>
      <form class="spend">
        <input name="spend" type="number" min="0.01" step="0.01" placeholder="0.00" required>
        <button>spend</button>
      </form>
    </td>
    <td class="actions"></td>
  `;
  row.cells[0].textContent = envelope.title;

  const spendForm = row.querySelector('form');
  spendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const spend = Number(spendForm.elements.spend.value);
    update(() => request(`/envelopes/${envelope.id}`, 'PUT', { spend }));
  });

  row.cells[3].append(
    button('edit', 'link', () => {
      editingId = envelope.id;
      load();
    }),
    button('delete', 'link delete', () => {
      if (confirm(`Delete "${envelope.title}"?`)) {
        update(() => request(`/envelopes/${envelope.id}`, 'DELETE'));
      }
    })
  );

  return row;
}

function editRow(envelope) {
  const row = document.createElement('tr');
  const titleInput = input('text', envelope.title);
  const budgetInput = input('number', envelope.budget);

  const save = () => {
    editingId = null;
    update(() => request(`/envelopes/${envelope.id}`, 'PUT', {
      title: titleInput.value,
      budget: Number(budgetInput.value),
    }));
  };

  const cancel = () => {
    editingId = null;
    load();
  };

  const cells = [titleInput, budgetInput, '', null];
  cells.forEach((content) => {
    const cell = row.insertCell();
    if (content) cell.append(content);
  });
  row.cells[1].className = 'money';
  row.cells[3].className = 'actions';
  row.cells[3].append(button('save', 'link', save), button('cancel', 'link', cancel));

  return row;
}

function fillSelect(select, envelopes) {
  const current = select.value;
  select.innerHTML = '';
  envelopes.forEach((envelope) => select.add(new Option(envelope.title, envelope.id)));
  if (current) select.value = current;
}

function fillCheckboxes(envelopes) {
  distributeList.innerHTML = '';
  envelopes.forEach((envelope) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = envelope.id;
    label.append(checkbox, ' ' + envelope.title);
    distributeList.append(label);
  });
}

function transactionRow(transaction) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${transaction.date}</td>
    <td></td>
    <td></td>
    <td class="money">-${money(transaction.amount)}</td>
    <td class="actions"></td>
  `;
  row.cells[1].textContent = transaction.recipient;
  row.cells[2].textContent = transaction.Envelope.title;

  row.cells[4].append(
    button('delete', 'link delete', () => {
      if (confirm('Delete this transaction? The money goes back to the envelope.')) {
        update(() => request(`/transactions/${transaction.id}`, 'DELETE'));
      }
    })
  );

  return row;
}

async function load() {
  const [{ totalBudget, envelopes }, transactions] = await Promise.all([
    request('/envelopes'),
    request('/transactions'),
  ]);

  totalEl.textContent = money(totalBudget);
  emptyEl.hidden = envelopes.length > 0;
  tableBody.replaceChildren(
    ...envelopes.map((envelope) => (envelope.id === editingId ? editRow(envelope) : viewRow(envelope)))
  );

  fillSelect(transferForm.elements.from, envelopes);
  fillSelect(transferForm.elements.to, envelopes);
  fillCheckboxes(envelopes);
  fillSelect(transactionForm.elements.envelopeId, envelopes);

  noTransactionsEl.hidden = transactions.length > 0;
  transactionsBody.replaceChildren(...transactions.map(transactionRow));
}

createForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { title, budget } = createForm.elements;
  update(async () => {
    await request('/envelopes', 'POST', { title: title.value, budget: Number(budget.value) });
    createForm.reset();
  });
});

transferForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { from, to, amount } = transferForm.elements;
  update(async () => {
    await request(`/envelopes/transfer/${from.value}/${to.value}`, 'POST', { amount: Number(amount.value) });
    amount.value = '';
  });
});

distributeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { amount } = distributeForm.elements;
  const envelopeIds = [...distributeList.querySelectorAll(':checked')].map((box) => Number(box.value));

  if (!envelopeIds.length) {
    showError('Choose at least one envelope to split into');
    return;
  }

  update(async () => {
    await request('/envelopes/distribute', 'POST', { amount: Number(amount.value), envelopeIds });
    amount.value = '';
  });
});

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { envelopeId, recipient, amount, date } = transactionForm.elements;
  update(async () => {
    await request('/transactions', 'POST', {
      envelopeId: Number(envelopeId.value),
      recipient: recipient.value,
      amount: Number(amount.value),
      date: date.value,
    });
    recipient.value = '';
    amount.value = '';
  });
});

transactionForm.elements.date.value = today();

load().catch((err) => showError(err.message));
