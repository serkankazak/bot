while read -r c; do

	use=$(df -h | grep '^/dev/root' | awk '{print $5}' | tr -d '%')
	if [ "$use" -gt 95 ]; then
		f=$(echo "$c" | awk '{print $2}')
		echo "$c"
		rm -f "$f"
	else
		exit
	fi

done < <(find /home/pi/ftp -type f -name *.mkv -printf '%T+ %p\n' | sort)
