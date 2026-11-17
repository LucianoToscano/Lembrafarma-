import { useEffect, useRef, useState } from "react";
import { buscarEstados } from "../../../utils/estados.js";
import { mascararCEP, buscarEnderecoPorCEP } from "../../../utils/cep.js";

export default function useAddressLookup() {
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [cidade, setCidade] = useState("");
  const [erroCep, setErroCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [estados, setEstados] = useState([]);
  const [estado, setEstado] = useState("");
  const [erroEstados, setErroEstados] = useState("");
  const buscaCepRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    buscarEstados(controller.signal)
      .then(setEstados)
      .catch((erro) => {
        if (erro.name !== "AbortError") setErroEstados(erro.message);
      });
    return () => controller.abort();
  }, []);

  async function handleCepChange(event) {
    const valor = mascararCEP(event.target.value);
    setCep(valor);
    setErroCep("");

    buscaCepRef.current?.abort();
    if (valor.length !== 9) {
      setBuscandoCep(false);
      return;
    }

    const controller = new AbortController();
    buscaCepRef.current = controller;
    setBuscandoCep(true);
    try {
      const endereco = await buscarEnderecoPorCEP(valor, controller.signal);
      setRua(endereco.rua);
      setCidade(endereco.cidade);
    } catch (erro) {
      if (erro.name === "AbortError") return;
      setRua("");
      setCidade("");
      setErroCep(erro.message);
    }
    if (!controller.signal.aborted) setBuscandoCep(false);
  }

  function reset() {
    buscaCepRef.current?.abort();
    setCep("");
    setRua("");
    setCidade("");
    setEstado("");
    setErroCep("");
    setBuscandoCep(false);
  }

  return {
    cep,
    rua,
    setRua,
    cidade,
    setCidade,
    erroCep,
    buscandoCep,
    estados,
    estado,
    setEstado,
    erroEstados,
    handleCepChange,
    reset,
  };
}
