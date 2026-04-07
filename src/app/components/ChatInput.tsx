"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const URL_REGEX = /https?:\/\/[^\s,;)}\]]+/gi;

export default function ChatInput({
  variant = "hero",
}: {
  variant?: "hero" | "cta";
}) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - images.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => {
          if (prev.length >= 3) return prev;
          return [...prev, { file, preview: reader.result as string }];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);

    // Save images to sessionStorage if present
    if (images.length > 0) {
      const base64Images = images.map((img) => img.preview);
      sessionStorage.setItem("stawiamy_images", JSON.stringify(base64Images));
    }

    // Detect first URL in prompt
    const urlMatch = prompt.match(URL_REGEX);
    const detectedUrl = urlMatch ? urlMatch[0] : null;

    let redirectUrl = `/preview?prompt=${encodeURIComponent(prompt.trim())}`;
    if (detectedUrl) {
      redirectUrl += `&url=${encodeURIComponent(detectedUrl)}`;
    }

    router.push(redirectUrl);
  };

  if (variant === "cta") {
    return (
      <div className="flex w-full max-w-xl items-center gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Opisz swój pomysł..."
          disabled={isLoading}
          className="flex-1 rounded-full bg-[#1a1a1a] px-6 py-4 text-white placeholder:text-[#adaaaa] outline-none border border-[#484847] focus:border-[#81ecff] transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="rounded-full bg-[#81ecff] px-8 py-4 font-semibold text-[#005762] hover:bg-[#00d4ec] transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-[#005762] animate-spin" />
              <span>Generuję...</span>
            </>
          ) : (
            "Zbuduj preview"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />
      <div className="rounded-[2rem] bg-[#000000] border border-[#484847] p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Strona, aplikacja, automatyzacja, agent AI... Opisz swój pomysł."
          rows={3}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-white placeholder:text-[#adaaaa] outline-none px-2 py-2 text-base disabled:opacity-50"
        />

        {/* Uploaded image thumbnails */}
        {images.length > 0 && (
          <div className="flex items-center gap-2 px-2 pb-2">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={`Załącznik ${i + 1}`}
                  className="h-16 w-16 rounded-lg object-cover border border-[#484847]"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#ff716c] text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  &#x2715;
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-16 w-16 rounded-lg border border-dashed border-[#484847] flex items-center justify-center text-[#adaaaa] hover:border-[#767575] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || images.length >= 3}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#484847] text-[#adaaaa] hover:border-[#767575] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#81ecff] text-[#005762] hover:bg-[#00d4ec] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-[#005762] animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xl">
                  arrow_upward
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
