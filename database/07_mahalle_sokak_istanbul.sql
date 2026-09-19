--
-- PostgreSQL database dump
--

-- Dumped from database version 12.1
-- Dumped by pg_dump version 12.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ilceler; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ilceler (
    ilce_id integer NOT NULL,
    ilce_adi character varying,
    il_id integer,
    il_adi character varying
);


ALTER TABLE public.ilceler OWNER TO postgres;

--
-- Name: iller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.iller (
    il_id integer NOT NULL,
    il_adi character varying
);


ALTER TABLE public.iller OWNER TO postgres;

--
-- Name: mahalleler; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mahalleler (
    mahalle_id integer NOT NULL,
    mahalle_adi character varying,
    ilce_id integer,
    ilce_adi character varying,
    il_id integer,
    il_adi character varying
);


ALTER TABLE public.mahalleler OWNER TO postgres;

--
-- Name: sokaklar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sokaklar (
    sokak_id integer NOT NULL,
    sokak_adi character varying,
    mahalle_id integer,
    mahalle_adi character varying,
    ilce_id integer,
    ilce_adi character varying,
    il_id integer,
    il_adi character varying
);


ALTER TABLE public.sokaklar OWNER TO postgres;

--
-- Data for Name: ilceler; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ilceler (ilce_id, ilce_adi, il_id, il_adi) FROM stdin;
1757	ALADAĞ	1	ADANA
1219	CEYHAN	1	ADANA
2033	ÇUKUROVA	1	ADANA
1329	FEKE	1	ADANA
1806	İMAMOĞLU	1	ADANA
1437	KARAİSALI	1	ADANA
1443	KARATAŞ	1	ADANA
1486	KOZAN	1	ADANA
1580	POZANTI	1	ADANA
1588	SAİMBEYLİ	1	ADANA
2032	SARIÇAM	1	ADANA
1104	SEYHAN	1	ADANA
1687	TUFANBEYLİ	1	ADANA
