const owner = "mahdinhc";        
const repo = "PCMI-Formulas";      
const branch = "main";   
const directory = "database"; 
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`

function getBasename(path) {
	const base = path.split(/[\\/]/).pop()
	const dotIndex = base.lastIndexOf('.')
	return dotIndex > 0 ? base.substring(0, dotIndex) : base
}

function parseMath(str) {
	let elm = document.createElement("div")
	elm.setAttribute("class", "math-container")
	let lines = str.split("\n")
	for (let line of lines) {
		elm.appendChild(asciimath.parseMath(line))
	}
	return elm
}

function buildJsTreeData(flatTree, directory) {
	const treeData = [];
	const dirPrefix = directory ? `${directory}/` : ""

	flatTree.forEach(item => {
		if (!item.path.startsWith(dirPrefix)) return

		let relativePath = item.path.substring(dirPrefix.length); 
		if (!relativePath) return

		let parent = "#";
		if (relativePath.includes('/')) {
			parent = relativePath.substring(0, relativePath.lastIndexOf('/'))
			if (parent === "") {
				parent = "#"
			}
		}
		
		const ext = item.path.substring(item.path.lastIndexOf('.'))
		let text = relativePath.split('/').pop()
		if (ext == ".md") text = `<i>${parseMath(text)}</i>`

		treeData.push({
			id: relativePath,
			parent: parent, 
			text: text, 
			icon: item.type === 'tree' ? "icons/folder.svg" : "icons/file.svg",
			data: {
				ext: ext,
				type: item.type === 'tree' ? "folder" : "file",
			}
		})
	})

	return treeData
}


function renderAsciiMath() {
	const input = document.getElementById("input").value
	document.getElementById("output").innerHTML = ""
	document.getElementById("output").append(parseMath(input))
}

document.getElementById("input").addEventListener("input", renderAsciiMath)

$(window).on("beforeunload", function() {
    localStorage.setItem("userInput", $("#input").val())
})

$(document).ready(function() {
	let savedInput = localStorage.getItem("userInput")
	if (savedInput) {
		$("#input").val(savedInput)
	}
	renderAsciiMath()
	$.getJSON(apiUrl, function(data) {
		if (data && data.tree) {
			const treeData = buildJsTreeData(data.tree, directory)
			$('#repoTree').jstree({
				core: {
					data: treeData
				}
			})
			.on('select_node.jstree', function(e, data) {
				const node = data.node;
				if (node.data.type == "file") {
					const filePath = directory ? `${directory}/${node.id}` : node.id
					const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
					$.get(rawUrl, function(fileData) {
						if (node.data.ext == ".asc") {
							$('#fileContent').html(parseMath(fileData))
						}
						else $('#fileContent').html(fileData)
					}).fail(function() {
						$('#fileContent').text("Error fetching file content.")
					});
				} 
				else {
					$('#fileContent').text("Select a file to view its content.")
				}
			})
		}
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		$('#repoTree').html('<p>Error fetching repository tree data. Please check the repository details and try again.</p>')
	})
})

$("#mode-renderer").click(function(){
	$(this).hide()
	$("#container-1").hide()
	$("#mode-database").show()
	$("#container-2").show()
})

$("#mode-database").click(function(){
	$(this).hide()
	$("#container-2").hide()
	$("#mode-renderer").show()
	$("#container-1").show()
})