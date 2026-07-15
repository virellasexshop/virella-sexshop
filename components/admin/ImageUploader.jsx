"use client";

import { useState } from "react";

export default function ImageUploader({ name = "imagem_principal" }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="imageUploader">
      <label className="uploadBox">
        <input
          type="file"
          name={name}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
        />

        {!preview ? (
          <div className="uploadEmpty">
            <strong>Selecionar imagem do computador</strong>
            <span>PNG, JPG ou WEBP</span>
          </div>
        ) : (
          <div className="uploadPreview">
            <img src={preview} alt="Preview da imagem" />
            <div>
              <strong>{fileName}</strong>
              <span>Clique para trocar a imagem</span>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}