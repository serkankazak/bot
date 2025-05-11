all=$(cat << EOM
/home/pi/ftp/files/<cam1_name>/record
/home/pi/ftp/files/<cam1_name>/snap/done
/home/pi/ftp/files/<cam1_name>/snap/done2
/home/pi/ftp/files/<cam2_name>/record
/home/pi/ftp/files/<cam2_name>/snap/done
/home/pi/ftp/files/<cam2_name>/snap/done2
/home/pi/ftp/files/<cam3_name>/record
/home/pi/ftp/files/<cam3_name>/snap/done
/home/pi/ftp/files/<cam3_name>/snap/done2
/home/pi/ftp/files/<cam4_name>/record
/home/pi/ftp/files/<cam4_name>/snap/done
/home/pi/ftp/files/<cam4_name>/snap/done2
/home/pi/ftp/files/<cam5_name>/record
/home/pi/ftp/files/<cam5_name>/snap/done
/home/pi/ftp/files/<cam5_name>/snap/done2
/home/pi/ftp/files/<cam6_name>/record
/home/pi/ftp/files/<cam6_name>/snap/done
/home/pi/ftp/files/<cam6_name>/snap/done2
EOM
)

while read -r cc; do
	while read -r c; do
		rm "$c"
	done < <(find "$cc" -type f)
done < <(echo "$all")

echo "cleared"
