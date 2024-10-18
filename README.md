# Dokumentation
Interaktive Medien 3
Wanaka Emmenegger wanaka.emmenegger@stud.fhgr.ch
Ricarda Schirato ricarda.schirato@stud.fhgr.ch 

## Kurzbeschreibung des Projekts
Ob zwischen der Auslastung der Parkhäuser in Zürich und der aktuellen Luftverschmutzung ein Zusammenhang besteht und ob die Luftverschmutzung ansteigt, sobald sich die Parkhäuser leeren - In unserem Projekt haben wir uns mit diesen Fragen beschäftigt. Wir haben die notwendigen Daten über mehrere Wochen jeweils stündlich von zwei verschiedenen API’s abgegriffen und diese Angaben umgewandelt in unserer eigens erstellten Datenbank via PHP gesichert. Bei der einen API handelt es sich um die Werte der Luftverschmutzung in Zürich (genauer gesagt PM2.5, PM10, NO2). Bei der anderen um die aktuelle Parkhäuserauslastung aller Parkhäuser in Zürich. Die aus der Datenbank resultierenden Ergebnisse haben wir in Form eines kombiniertes Säulen- und Liniendiagramm auf unserer Website dargestellt. Dazu haben wir noch ein Kuchendiagramm mit den drei anteilsmässig grössten Luftverschmutzungspartikel der letzten 24-Stunden erstellt. Im unteren Teil der Website haben wir die wichtigsten Beobachtungen zu der Grafik festgehalten.

## Learnings
Wir haben gemerkt, wie sinnvoll es ist, wirklich genügend Zeit in die Planung des Projekts, insbesondere auch in den Aufbau der Datenbank zu stecken. In unserem Fall hätte es womöglich auch Sinn gemacht, zwei verschiedene Datenbanken (pro API eine) zu erstellen, da es sich um zwei sehr verschiedene API’s gehandelt hat, mit ganz unterschiedlichen Werten. Ausserdem muss man sich unbedingt vorgängig gut überlegen, welche Daten wir für unser Projekt benötigen, also was wir wie in der Datenbank sammeln wollen und wie wir die Ergebnisse visuell darstellen wollen. Wir haben gelernt, wie wichtig es ist, mit API-Daten effizient umzugehen und die Visualisierung entsprechend anzupassen, um die Daten nachvollziehbar darzustellen.

## Schwierigkeiten

Achsenbeschriftungen
Wir stellen in einer Grafik mehrere Werte auf der X Achse dar (Auslastung Parkhäsuer + Verschmutzungs-Grad der Luft). Dabei war die Achsenbeschriftung eine Herausforderung um sie sinnvoll zu gestallten. Die Parkhausauslastung war logischerweise max auf 100% gesetzt. Dazu passte es am besten, die Höchstwerte der Verschmutzung auf max 50 µg/m³ zu setzen. So kommen sich auch die horizontalen Grids nicht in die Quere sondern ergänzen sich.

Zusammenführen 2 APIs in einer DB
Dadurch, dass wir beide API’s zusammen in einer Datenbank gesichert haben, erhielten wir jeweils bei einem Teil der Spalten viele leere Zeilen. Also bei der Luftqualität waren die Parkhaus-Spalten leer und umgekehrt. Dies macht die Datenbank unübersichtlicher. Es wäre wahrscheinlich sinnvoller gewesen, von Anfang an zwei verschiedene Datenbanken zu erstellen.

Zeitformat der API
Durch die Unterstützung eines Informatikers fanden wir heraus, dass die API der Parkhäuser in einem anderen Zeitformat (UTC) angegeben wurden als die der Luftqualität (MESZ). Für den Datenvergleich in unserer Grafik, wurde jedoch vorausgesetzt, dass beides im gleichen Zeitformat ausgegeben wird. Es musste also eine Vereinheitlichung erfolgen. Im VSC haben wir also dafür gesorgt, dass das Zeitformat der Parkhausdaten in das Zeitformat MESZ umgewandelt wird. 

Zu viele Daten in der DB
Unsere Air Quality API lieferte uns jeweils 3 Werte (PM10, PM2.5, NO2) und pro Stunde für 5 Tage zurück und 1 Tag in die Zukunft. So haben wir sehr schnell eine grosse Datenmenge angesammelt, in der sich die Werte immer wieder gedoppelt haben. Leider haben wir keine Möglichkeit gefunden, wie wir nur die Daten der aktuellen Stunde speichern können.

Responsive Diagramm
Unser Balken Diagramm ist in der Mobile Version nicht gut ersichtlich. Es wird über eine ID definiert, die wir leider nicht wissen, wie wir sie beeinflussen können. Auch die Dozenten konnten uns auf die Schnelle nicht helfen. Ein vorgeschlagener Workaround war, mit einer «Hidde-Mobile» und «Hide-Desktop» Class zwei Diagramme zu erstellen, beim Mobile Diagramm die Höhe anzupassen und jeweils im Mediaquerry das eine ein- resp. auszublenden. Leider hat das nicht funktioniert. Wir schätzen, dass das daran liegt, dass die ID «parkhausChart» durch die Kopie vom canvas doppelt vorhanden und dadurch nichts mehr angezeigt wurde. Auch die gesamte Javascript Funktion zu kopieren und eine 2. ID zu vergeben, hat nur bedingt funktioniert und unseren Code ziemlich chaotisch gemacht. Leider haben wir bis zur Projekt-Abgabe keine gescheite Lösung finden können.

## Benutze Ressourcen

KI- Freund und Helfer
ChatGPT war uns eine grosse Stütze beim Codieren. Sei es, um einen Fehler im Code aufzudecken oder eine Grundstruktur mittels Kommentare für den Code zu erhalten. Etwas schwierig war es, den Prompt richtig zu formulieren, damit ChatGPT die Problematik richtig erkannte. Ein weiterer Nachteil war, dass ChatGPT teilweise relevante Teile des Codes wegliess oder sogar veränderte, sobald man den bereits bestehenden Code ergänzen wollte. Manchmal beschrieb es diese Änderungen dann nicht und es funktionierte noch weniger als zuvor. Auch der Copilot im Visual-Studiocode stand uns bei Tippfehlern tatkräftig zur Seite. Dank ihm wurden Tippfehler entdeckt und durch die Autovorschläge war man effizienter und schneller beim Codieren.

Unterlagen aus dem Unterricht
Die Powerpoints und Code-Alongs aus dem Unterricht waren uns dienlich. Bei Unsicherheiten konnten wir diese konsultieren und bereits in Vergessenheit geratenes wieder auffrischen.

Kontakte spielen lassen
Irgendwann kamen wir an den Punkt, wo wir mit unserem Wissen und dem von ChatGPT nicht mehr weiterkamen. Wir holten uns Rat bei einem leidenschaftlichen Informatiker. Er konnte uns bei kleinen Ungereimtheiten im Code weiterhelfen (bspw. falsche Reihenfolge im Code), die wir selbst leider nicht aufgedeckt hätten. So bemerkten wir dank seiner Hilfe, dass die beiden API’s in unterschiedlichen Zeitformaten geführt wurden (siehe auch Schwierigkeiten).

## LÖSCHEN
Offene Punkte
- Kommentare Code
- Read me


Geschlossene Punkte
- Favicon
- Auto Header mit ZH Kennzeichen
- Code Validierung
- Responsive
- Journalistischer Inhalt
- Daten mit DB ableichen
- Fahren zu Morgen / Feierabend

Schwierigkeiten
- Zeitformat (Sommerzeit?) evtl Lücke / Doppelte Daten
- Achse der Luftverschmutzung in beiden Statistiken gleich hoch 
- Luftverschmutzung statt Qualiät -> negaitver
- zu viele Daten in DB durch Forcast und stündlicher Abgleich aller Daten
- Anpassungen Figma
- Statistik Responsive
- 2 Apis in DB nicht auf einer Zeile

evtl. noch die Links?
Chartjs. 
jslibrary
