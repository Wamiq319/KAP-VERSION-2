import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLanguage } from "../redux/slices/langgSlice";
import { arflag, usflag } from "../assets";

const LanguageSwitcher = () => {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.lang.lang);

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ar" : "en";
    dispatch(setLanguage(newLang));
    document.documentElement.setAttribute(
      "dir",
      newLang === "ar" ? "rtl" : "ltr"
    );
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center justify-center gap-2
        px-3 py-2
        rounded-full
        bg-white
        text-green-700 text-sm font-medium
        shadow-md hover:shadow-lg
        transition-all duration-200
        border border-green-300
        hover:bg-gray-50
      `}
      aria-label="Toggle language"
    >
      <img
        src={lang === "en" ? arflag : usflag}
        alt={lang === "en" ? "Switch to Arabic" : "Switch to English"}
        className="w-6 h-6 rounded-full object-cover border border-green-200"
      />
      <span className="text-green-800">
        {lang === "en" ? "العربية" : "English"}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
