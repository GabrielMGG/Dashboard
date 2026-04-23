// --- VARIAVEIS GLOBAIS variáveis que precisam ser lembradas entre as funções ---
let pagAtual = 1; // qual página o usuário está agora
const userPerPage = 10; // quantos usuários aparecem por página (não muda)
let skip = (pagAtual - 1) * userPerPage; // quantos usuários pular na API
const dataPag = document.querySelectorAll('[data-page]'); // botões de página

let searchUser = ""; // o que o usuário digitou na busca
let timer; // guarda o timer do debounce pra poder cancelar
let statusFiltro = document.querySelector('select option:first-child').value; // filtro de status atual (começa com "todos")
let meuStatus; // array de usuários que vai ser renderizado (muda conforme filtro)
let IdOpen;// id do usuário cujo modal está aberto

// --- BUSCA NA API, vai pegar os usuarios com paginação e filtro de nome ---
async function carregarDadosApi() {
    try {
        // URL com os parametros atuais de busca, limite e pulo
        const response = await fetch(`https://dummyjson.com/users/search?q=${searchUser}&limit=${userPerPage}&skip=${skip}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dados = await response.json();
        return dados;
    }
    catch (erro) {
        console.error('Erro ao buscar dados:', erro);
    }
}

// --- BUSCA COM DEBOUNCE, espera o usuario parar de digitar antes de buscar ---
function buscaUsers() {
    const inputBusca = document.getElementById('buscar');

    inputBusca.addEventListener('input', () => {
        clearTimeout(timer); // cancela o timer anterior pra nao fazer requisicoes desnecessarias

        searchUser = inputBusca.value;
        timer = setTimeout(async () => {
            // so executa 500ms depois que o usuario parou de digitar
            pagAtual = 1;  // volta pra pagina 1 porque os resultados sao diferentes
            skip = (pagAtual - 1) * userPerPage;// recalcula o skip
            const totalPag = await paginacao();
            main();
        }, 500);
    });
}
buscaUsers();

// --- CALCULA TOTAL DE PAGINAS, vai limita ao maximo que eu quero mostrar ---
async function paginacao() {
    const dados = await carregarDadosApi();

    const usersTotal = dados.total; // total real da API que 208
    const totalPagDaApi = Math.ceil(usersTotal / userPerPage);// quantas paginas dariam no total
    const meuLimite = 3; // quantidade maxima de paginas que eu quero mostr
    const totalPag = Math.min(totalPagDaApi, meuLimite);// pega o menor entre os dois
    return totalPag;
}

// --- CONTROLA OS BOTOES Das paginas, proximo, anterior e numeros ---
async function mudarPagina() {
    const prox = document.querySelector('.proximo');
    const anter = document.querySelector('.anterior');
    const totalPag = await paginacao();

    prox.addEventListener('click', () => {
        if (pagAtual == totalPag) {
            // se ja esta na ultima pagina, volta pra primeira
            pagAtual = 1;
            skip = (pagAtual - 1) * userPerPage;
            atualizarActive();
            main();
        }
        else {
            // senao, avanca uma pagina
            pagAtual++;
            skip = (pagAtual - 1) * userPerPage;
            atualizarActive();
            main();
        }
    });

    anter.addEventListener('click', () => {
        if (pagAtual == 1) {
            // se ja esta na primeira pagina, vai pra ultima
            pagAtual = totalPag;
            skip = (pagAtual - 1) * userPerPage;
            atualizarActive();
            main();
        }
        else {
            // senao, volta uma pagina
            pagAtual--;
            skip = (pagAtual - 1) * userPerPage;
            atualizarActive();
            main();
        }
    });

    // clique direto em um numero de pagina
    dataPag.forEach((botao) => {
        botao.addEventListener('click', () => {
            pags = botao.dataset.page;
            pagAtual = parseInt(pags);
            skip = (pagAtual - 1) * userPerPage;
            atualizarActive();
            main();
        });
    });
}

// --- ATUALIZA O BOTÃO ATIVO remove active de todos e coloca no atual ---
function atualizarActive() {
    dataPag.forEach((data) => {
        data.classList.remove('active');
    });
    document.querySelector(`[data-page="${pagAtual}"]`).classList.add('active');
}

// --- VAI FILTRAR OS STATUS,  escuta mudancas no select e chama o main ---
function usersOnOff() {
    const select = document.querySelectorAll('select');
    select.forEach((status) => {
        status.addEventListener('change', () => {
            statusFiltro = status.value;
            main(); // main ja sabe qual filtro aplicar pelo statusFiltro global
        });
    });
}

// --- FUNCÃO PRINCIPAL busca os dados, filtra e renderiza a tabela ---
async function main() {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`; // feedback enquanto busca

    const dados = await carregarDadosApi();
    const users = dados.users;
    meuStatus = users;

    // filtra ativos "id par" e inativos "id impar" do array atual
    const par = dados.users.filter(user => user.id % 2 === 0);
    const impar = dados.users.filter(user => user.id % 2 !== 0);

    tbody.innerHTML = "";

    if (users.length === 0) {
        // nenhum resultado encontrado
        tbody.innerHTML = `<tr><td colspan="5">Não existe nenhum usuario cadastrado nessa pagina com o nome de "${searchUser}".</td></tr>`;
    } else if (statusFiltro === "2") {
        meuStatus = par;   // so ativos
    } else if (statusFiltro === "3") {
        meuStatus = impar; // so inativos
    } else {
        meuStatus = users; // todos
    }

    // renderiza as linhas da tabela com o array certo
    function tabelaUser() {
        meuStatus?.forEach(user => {
            const linhas = `
                <tr>
                  <td>${user.firstName} ${user.lastName}</td>
                  <td>${user.email}</td>
                  <td>${user.company.name}</td>
                  <td>
                    <span class="badge ${user.id % 2 === 0 ? 'status-active' : 'status-inactive'}">
                      ${user.id % 2 === 0 ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="open-modal btn-edit" data-mode="edit" data-modal="editar-modal" data-id="${user.id}">Editar</button>
                    <button class="open-modal btn-view" data-mode="view" data-modal="editar-modal" data-id="${user.id}">Ver</button>
                  </td>
                </tr>`;
            tbody.innerHTML += linhas;
        });
    }
    tabelaUser();
}

// --- ABRE O MODAL  e usa event  no tbody pra pegar botoes dinamicos ---
// event delegaton um listener no pai "tbody"" cobre todos os botoes
const tbody = document.getElementById('user-table-body');

tbody.addEventListener('click', async (event) => {
    if (event.target.classList.contains('open-modal')) {
        const id = event.target.getAttribute('data-id');
        const modalId = event.target.getAttribute('data-modal');
        const mode = event.target.getAttribute('data-mode'); // edit ou view

        const modal = document.getElementById(modalId);
        IdOpen = id; // salva o id globalmente pra usar no PUT

        await pegarDadosUser(id, mode); // busca e preenche o modal antes de abrir
        modal.showModal();
    }
});

// --- VAI FECHAR O MODAL close sobe pelo DOM ate achar o dialog pai ---
const closeModal = document.querySelector('.close-modal');
closeModal.addEventListener('click', (event) => {
    const modal = event.target.closest('dialog');
    modal.close();
});

// --- VAI PREENCHER O MODAL, busca os dados do usuario e preenche os campos ---
async function pegarDadosUser(id, mode) {
    const response = await fetch(`https://dummyjson.com/users/${id}`);
    const dados = await response.json();

    const inputNome = document.getElementById('input-nome');
    const inputEmail = document.getElementById('input-email');
    const inputEmpresa = document.getElementById('input-empresa');
    const btnSave = document.getElementById('btn-save');
    const modalTitle = document.querySelector('#editar-modal h2');

    // preenche os campos com os dados do usuario
    inputNome.value = `${dados.firstName} ${dados.lastName}`;
    inputEmail.value = dados.email;
    inputEmpresa.value = dados.company.name;
    document.getElementById('info-status').innerText = dados.id % 2 === 0 ? 'Ativo' : 'Inativo';

    if (mode === 'view') {
        // modo visualizacao desabilita campos e muda o botao pra fechar
        inputNome.disabled = true;
        inputEmail.disabled = true;
        inputEmpresa.disabled = true;
        modalTitle.innerText = "Detalhes do Usuário";
        btnSave.innerText = "Fechar";
        btnSave.setAttribute('data-action', 'close');
    } else {
        // modo edicao habilita campos e mostra botao de salvar
        inputNome.disabled = false;
        inputEmail.disabled = false;
        inputEmpresa.disabled = false;
        modalTitle.innerText = "Editar usuário";
        btnSave.innerText = "Salvar alterações";
        btnSave.setAttribute('data-action', 'save');
    }

    // atualiza as cores do status remove as duas e adiciona a atual
    document.getElementById('span-status').classList.remove('status-active', 'status-inactive');
    document.getElementById('span-status').classList.add(dados.id % 2 === 0 ? 'status-active' : 'status-inactive');
    document.getElementById('bolinha').classList.remove('status-dot-ativo', 'status-dot-inativo');
    document.getElementById('bolinha').classList.add(dados.id % 2 === 0 ? 'status-dot-ativo' : 'status-dot-inativo');
}

// --- SALVA AS ALTERAÇÕES, envia PUT pra API com os dados editados ---
function postDados() {
    const btnSalva = document.getElementById('btn-save');

    btnSalva.addEventListener('click', async (event) => {
        const modal = event.target.closest('dialog');

        // se o botao estiver no modo fechar, so fecha o modal
        if (btnSalva.getAttribute('data-action') === 'close') {
            modal.close();
            return;
        }

        // modo edicao: pega os valores dos inputs
        const nomeCompleto = document.getElementById('input-nome').value.trim();
        const parteNome = nomeCompleto.split(" ");       // divide o nome completo em partes
        const primeiroNome = parteNome[0];               // pega a primeira parte
        const sobreNome = parteNome.slice(1).join(" ");  // junta o resto como sobrenome

        const email = document.getElementById('input-email').value;
        const empresa = document.getElementById('input-empresa').value;

        // envia os dados atualizados pra API
        // obs: a dummyjson e uma API fake, nao sera salvo de verdade, mas o codigo funciona
        await fetch(`https://dummyjson.com/users/${IdOpen}`, {
            method: 'PUT',                                    // PUT = atualiza
            headers: { 'Content-Type': 'application/json' }, // avisa que estamos mandando o JSON
            body: JSON.stringify({                            // converte objeto JS pra texto
                firstName: primeiroNome,
                lastName: sobreNome,
                email: email,
                company: { name: empresa }
            })
        })
        .then(r => r.json())
        .then(d => console.log("Dados atualizados:", d));

        modal.close();
        await main(); // recarrega a tabela depois de salvar
    });
}

// --- INICIALIZAÇÃO: roda tudo uma vez quando a página carrega ---
postDados();
atualizarActive();
main();
usersOnOff();
mudarPagina();