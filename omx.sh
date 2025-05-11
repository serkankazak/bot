# buster needed

s1="<s1>"
s2="<s2>"
s3="<s3>"
s4="<s4>"
s5="<s5>"
ofx=30
ofy=20
n=37
ex=$((60*60))

function bye {

	killall -9 omxplayer
	killall -9 omxplayer.bin

	pid=$(ps aux | grep "omx.sh cycle" | grep -v ' grep ' | awk '{print $2}')
	pidc=$(echo "$pid" | wc -c)
	if [ $pidc -gt 1 ]; then
		kill -9 $pid
	fi

}

if [ "$1" == "e" ]; then
	bye
elif [ "$1" == "1" ]; then
	bye
	timeout $ex omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer1 --win "$ofx $ofy $((ofx + 16*n)) $((ofy + 9*n))" -b --live $s5 &
	timeout $ex omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer2 --win "$((ofx + 16*n)) $ofy $((ofx + 2*16*n)) $((ofy + 9*n))" --live $s2 &
	timeout $ex omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer3 --win "$ofx $((ofy + 9*n)) $((ofx + 16*n)) $((ofy + 2*9*n))" --live $s3 &
elif [ "$1" == "2" ]; then
	bye
	timeout $ex omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer1 --win "$ofx $ofy $((ofx + 16*n)) $((ofy + 9*n))" -b --live $s4 &
	timeout $ex omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer2 --win "$((ofx + 16*n)) $ofy $((ofx + 2*16*n)) $((ofy + 9*n))" --live $s1 &
elif [ "$1" == "cycle" ]; then

	m=0

	c=0
	while [ $c -lt $ex ]; do

		if [ $((c % 120)) == 0 ]; then

			if [ $m == 0 ]; then
				m=1

				killall -9 omxplayer
				killall -9 omxplayer.bin
				omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer1 --win "$ofx $ofy $((ofx + 16*n)) $((ofy + 9*n))" -b --live $s5 &
				omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer2 --win "$((ofx + 16*n)) $ofy $((ofx + 2*16*n)) $((ofy + 9*n))" --live $s2 &
				omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer3 --win "$ofx $((ofy + 9*n)) $((ofx + 16*n)) $((ofy + 2*9*n))" --live $s3 &

			else
				m=0

				killall -9 omxplayer
				killall -9 omxplayer.bin
				omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer1 --win "$ofx $ofy $((ofx + 16*n)) $((ofy + 9*n))" -b --live $s4 &
				omxplayer --dbus_name org.mpris.MediaPlayer2.omxplayer2 --win "$((ofx + 16*n)) $ofy $((ofx + 2*16*n)) $((ofy + 9*n))" --live $s1 &

			fi

		fi

		sleep 1
		((c++))
	done

	killall -9 omxplayer
	killall -9 omxplayer.bin

fi
