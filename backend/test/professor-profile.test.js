const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parse } = require("../src/domain");

test("perfil docente aceita titulação e Lattes e mantém informações opcionais", () => {
  const profile = parse("professors", {
    name: "Ana Souza",
    qualification: "Doutorado",
    lattesUrl: "https://lattes.cnpq.br/1234567890123456",
  });
  assert.equal(profile.qualification, "Doutorado");
  assert.equal(profile.lattesUrl, "https://lattes.cnpq.br/1234567890123456");
  const minimal = parse("professors", { name: "Ana Souza" });
  assert.equal(minimal.qualification, "");
  assert.equal(minimal.lattesUrl, "");
  assert.throws(() =>
    parse("professors", { name: "Ana Souza", roomId: "b-204" }),
  );
});

test("perfil docente rejeita links inválidos e titulações desconhecidas", () => {
  for (const lattesUrl of [
    "javascript:alert(1)",
    "https://example.com/1234567890123456",
    "https://lattes.cnpq.br.evil.com/1234567890123456",
    "https://lattes.cnpq.br/123",
  ]) {
    assert.throws(() => parse("professors", { name: "Ana Souza", lattesUrl }));
  }
  assert.throws(() =>
    parse("professors", { name: "Ana Souza", qualification: "Outra" }),
  );
});
